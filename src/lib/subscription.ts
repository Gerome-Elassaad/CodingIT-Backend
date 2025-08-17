import { createServerClient } from './supabase-server';
import { stripe, STRIPE_PLANS, StripePlanType } from './stripe';
import Stripe from 'stripe';

export interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  customerId: string;
}

export async function createCheckoutSession(
  teamId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const supabase = createServerClient(true);

  // Get or create Stripe customer
  const { data: team } = await supabase
    .from('teams')
    .select('stripe_customer_id, name, email')
    .eq('id', teamId)
    .single();

  if (!team) {
    throw new Error('Team not found');
  }

  let customerId = team.stripe_customer_id;

  // Create customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: team.email,
      name: team.name,
      metadata: {
        teamId: teamId,
      },
    });

    customerId = customer.id;

    // Update team with customer ID
    await supabase
      .from('teams')
      .update({ stripe_customer_id: customerId })
      .eq('id', teamId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    metadata: {
      teamId: teamId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

export async function createPortalSession(
  teamId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const supabase = createServerClient(true);

  const { data: team } = await supabase
    .from('teams')
    .select('stripe_customer_id')
    .eq('id', teamId)
    .single();

  if (!team?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}

export async function getTeamSubscription(teamId: string): Promise<SubscriptionData | null> {
  const supabase = createServerClient(true);

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.stripe_subscription_id,
    status: subscription.status,
    planType: subscription.plan_type,
    currentPeriodStart: new Date(subscription.current_period_start),
    currentPeriodEnd: new Date(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    customerId: subscription.stripe_customer_id,
  };
}

export async function getTeamUsageLimits(teamId: string) {
  const subscription = await getTeamSubscription(teamId);
  
  if (!subscription) {
    // Free tier limits
    return {
      maxProjects: 3,
      maxFragments: 50,
      maxExecutions: 100,
      maxStorage: 100, // MB
      hasAdvancedFeatures: false,
      planType: 'free'
    };
  }

  const plan = Object.values(STRIPE_PLANS).find(p => 
    subscription.planType === Object.keys(STRIPE_PLANS).find(key => 
      STRIPE_PLANS[key as StripePlanType] === p
    )
  );

  if (subscription.planType === 'pro-monthly') {
    return {
      maxProjects: -1, // Unlimited
      maxFragments: -1, // Unlimited
      maxExecutions: -1, // Unlimited
      maxStorage: -1, // Unlimited
      hasAdvancedFeatures: true,
      planType: 'pro-monthly'
    };
  }

  if (subscription.planType === 'pro-basic') {
    return {
      maxProjects: 25,
      maxFragments: 500,
      maxExecutions: 1000,
      maxStorage: 1000, // MB
      hasAdvancedFeatures: true,
      planType: 'pro-basic'
    };
  }

  // Default to free tier
  return {
    maxProjects: 3,
    maxFragments: 50,
    maxExecutions: 100,
    maxStorage: 100,
    hasAdvancedFeatures: false,
    planType: 'free'
  };
}

export async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  const supabase = createServerClient(true);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Get team ID from customer metadata
      const customer = await stripe!.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const teamId = customer.metadata?.teamId;

      if (!teamId) {
        console.error('No team ID found in customer metadata');
        return;
      }

      // Determine plan type from price ID
      const priceId = subscription.items.data[0]?.price.id;
      const planType = Object.keys(STRIPE_PLANS).find(key => 
        STRIPE_PLANS[key as StripePlanType].priceId === priceId
      ) as StripePlanType;

      if (!planType) {
        console.error('Unknown price ID:', priceId);
        return;
      }

      // Upsert subscription
      await supabase
        .from('subscriptions')
        .upsert({
          team_id: teamId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          plan_type: planType,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          created_at: new Date(subscription.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

      console.log(`Subscription ${event.type} processed for team ${teamId}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      console.log(`Subscription canceled: ${subscription.id}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', invoice.subscription as string);

        console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', invoice.subscription as string);

        console.log(`Payment failed for subscription: ${invoice.subscription}`);
      }
      break;
    }
  }
}