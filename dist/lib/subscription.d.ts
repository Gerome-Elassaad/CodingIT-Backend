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
export declare function createCheckoutSession(teamId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<string>;
export declare function createPortalSession(teamId: string, returnUrl: string): Promise<string>;
export declare function getTeamSubscription(teamId: string): Promise<SubscriptionData | null>;
export declare function getTeamUsageLimits(teamId: string): Promise<{
    maxProjects: number;
    maxFragments: number;
    maxExecutions: number;
    maxStorage: number;
    hasAdvancedFeatures: boolean;
    planType: string;
}>;
export declare function handleSubscriptionEvent(event: Stripe.Event): Promise<void>;
