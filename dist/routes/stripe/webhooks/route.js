"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const stripe_1 = require("@/lib/stripe");
const subscription_1 = require("@/lib/subscription");
exports.dynamic = 'force-dynamic';
async function POST(request) {
    if (!stripe_1.stripe) {
        return server_1.NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Missing Stripe signature or webhook secret');
        return server_1.NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    try {
        const event = stripe_1.stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
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
                await (0, subscription_1.handleSubscriptionEvent)(event);
                console.log(`Successfully processed event: ${event.type} (${event.id})`);
                break;
            default:
                console.log(`Unhandled event type: ${event.type} (${event.id})`);
        }
        return server_1.NextResponse.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return server_1.NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
    }
}
//# sourceMappingURL=route.js.map