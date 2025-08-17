import { Router } from 'express';
import express from 'express';
import { createServerClient } from '@/lib/supabase-server';
import { createCheckoutSession, createPortalSession } from '@/lib/subscription';
import { STRIPE_PLANS, stripe } from '@/lib/stripe';

const router = Router();

// Create checkout session - POST /api/stripe/checkout
router.post('/checkout', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { planType } = req.body;

    if (!planType || !STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];
    
    if (!plan.priceId) {
      return res.status(400).json({ error: 'Plan not available for checkout' });
    }

    // For now, we'll use a mock team ID - in production you'd get this from authentication
    const mockTeamId = 'team_' + Math.random().toString(36).substring(2, 15);
    const origin = req.headers.origin || 'http://localhost:3000';
    
    const checkoutUrl = await createCheckoutSession(
      mockTeamId,
      plan.priceId,
      `${origin}/dashboard?success=true`,
      `${origin}/pricing?canceled=true`
    );

    return res.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Create portal session - POST /api/stripe/portal
router.post('/portal', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    const origin = req.headers.origin || 'http://localhost:3000';
    
    const portalUrl = await createPortalSession(
      teamId,
      `${origin}/dashboard`
    );

    return res.json({ url: portalUrl });
  } catch (error: any) {
    console.error('Portal error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Handle Stripe webhooks - POST /api/stripe/webhooks
router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const signature = req.headers['stripe-signature'] as string;

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe signature or webhook secret');
      return res.status(400).json({ error: 'Missing signature' });
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Processing webhook event: ${event.type}`, {
      eventId: event.id,
      metadata: 'metadata' in event.data.object ? event.data.object.metadata : undefined
    });

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await handleSubscriptionEvent(event);
        console.log(`Successfully processed event: ${event.type} (${event.id})`);
        break;
      default:
        console.log(`Unhandled event type: ${event.type} (${event.id})`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      error: 'Webhook handler failed',
      details: error.message
    });
  }
});

// Get subscription status - GET /api/stripe/subscription/:teamId
router.get('/subscription/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const supabase = createServerClient(true);

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return res.json({ subscription: null, planType: 'free' });
    }

    return res.json({
      subscription: {
        id: subscription.stripe_subscription_id,
        status: subscription.status,
        planType: subscription.plan_type,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      planType: subscription.plan_type
    });
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription',
      details: error.message
    });
  }
});

async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
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
        STRIPE_PLANS[key as keyof typeof STRIPE_PLANS].priceId === priceId
      );

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

export const stripeRouter = router;