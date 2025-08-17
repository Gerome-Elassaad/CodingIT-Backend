"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const subscription_1 = require("@/lib/subscription");
const stripe_1 = require("@/lib/stripe");
exports.dynamic = 'force-dynamic';
async function POST(request) {
    try {
        if (!stripe_1.stripe) {
            return server_1.NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
        }
        const supabase = (0, supabase_server_1.createServerClient)();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { planType } = body;
        if (!planType || !stripe_1.STRIPE_PLANS[planType]) {
            return server_1.NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }
        const plan = stripe_1.STRIPE_PLANS[planType];
        if (!plan.priceId) {
            return server_1.NextResponse.json({ error: 'Plan not available for checkout' }, { status: 400 });
        }
        // Get user's default team
        const { data: userTeam } = await supabase
            .from('users_teams')
            .select('teams (id, name, email)')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();
        if (!userTeam?.teams) {
            return server_1.NextResponse.json({ error: 'No default team found' }, { status: 400 });
        }
        const team = userTeam.teams;
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const checkoutUrl = await (0, subscription_1.createCheckoutSession)(team.id, plan.priceId, `${origin}/settings/billing?success=true`, `${origin}/settings/billing?canceled=true`);
        return server_1.NextResponse.json({ url: checkoutUrl });
    }
    catch (error) {
        console.error('Checkout error:', error);
        return server_1.NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map