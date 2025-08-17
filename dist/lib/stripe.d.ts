import Stripe from 'stripe';
export declare const stripe: Stripe | null;
export declare const STRIPE_PLANS: {
    'pro-monthly': {
        priceId: string;
        name: string;
        description: string;
        price: number;
        mode: "subscription";
        interval: "month";
    };
    'pro-basic': {
        priceId: string;
        name: string;
        description: string;
        price: number;
        mode: "subscription";
        interval: "month";
    };
};
export type StripePlanType = keyof typeof STRIPE_PLANS;
export declare function validateWebhookSignature(body: string, signature: string): Stripe.Event;
export declare function createCheckoutSession(priceId: string, customerId?: string, metadata?: Record<string, string>): Promise<string>;
export declare function createPortalSession(customerId: string): Promise<string>;
export declare function getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]>;
export declare function cancelSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
