import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
}) : null;

export const STRIPE_PLANS = {
  'pro-monthly': {
    priceId: 'price_1Rx0l5H9eqg6cvCREX7AOwFH',
    name: 'Pro Plan',
    description: 'Advanced features and unlimited access',
    price: 8999, // $89.99 in cents
    mode: 'subscription' as const,
    interval: 'month' as const,
  },
  'pro-basic': {
    priceId: 'price_1Rx0Y5H9eqg6cvCR8CyjbzOt', 
    name: 'Pro plan',
    description: 'Essential features for professionals',
    price: 999, // $9.99 in cents
    mode: 'subscription' as const,
    interval: 'month' as const,
  }
};

export type StripePlanType = keyof typeof STRIPE_PLANS;

export function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe not configured');
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

export async function createCheckoutSession(
  priceId: string,
  customerId?: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
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
    metadata,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  return session.url;
}

export async function getCustomerSubscriptions(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data;
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  return await stripe.subscriptions.cancel(subscriptionId);
}