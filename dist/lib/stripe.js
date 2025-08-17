"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PLANS = exports.stripe = void 0;
exports.validateWebhookSignature = validateWebhookSignature;
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.getCustomerSubscriptions = getCustomerSubscriptions;
exports.cancelSubscription = cancelSubscription;
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
exports.stripe = stripeSecretKey ? new stripe_1.default(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
}) : null;
exports.STRIPE_PLANS = {
    'pro-monthly': {
        priceId: 'price_1Rx0l5H9eqg6cvCREX7AOwFH',
        name: 'Pro Plan',
        description: 'Advanced features and unlimited access',
        price: 8999, // $89.99 in cents
        mode: 'subscription',
        interval: 'month',
    },
    'pro-basic': {
        priceId: 'price_1Rx0Y5H9eqg6cvCR8CyjbzOt',
        name: 'Pro plan',
        description: 'Essential features for professionals',
        price: 999, // $9.99 in cents
        mode: 'subscription',
        interval: 'month',
    }
};
function validateWebhookSignature(body, signature) {
    if (!exports.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe not configured');
    }
    return exports.stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
async function createCheckoutSession(priceId, customerId, metadata) {
    if (!exports.stripe) {
        throw new Error('Stripe not configured');
    }
    const session = await exports.stripe.checkout.sessions.create({
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
async function createPortalSession(customerId) {
    if (!exports.stripe) {
        throw new Error('Stripe not configured');
    }
    const session = await exports.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    });
    return session.url;
}
async function getCustomerSubscriptions(customerId) {
    if (!exports.stripe) {
        throw new Error('Stripe not configured');
    }
    const subscriptions = await exports.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        expand: ['data.default_payment_method'],
    });
    return subscriptions.data;
}
async function cancelSubscription(subscriptionId) {
    if (!exports.stripe) {
        throw new Error('Stripe not configured');
    }
    return await exports.stripe.subscriptions.cancel(subscriptionId);
}
//# sourceMappingURL=stripe.js.map