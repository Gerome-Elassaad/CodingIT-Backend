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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get user's default team
        const { data: userTeam } = await supabase
            .from('users_teams')
            .select('teams (id, stripe_customer_id)')
            .eq('user_id', session.user.id)
            .eq('is_default', true)
            .single();
        if (!userTeam?.teams) {
            return server_1.NextResponse.json({ error: 'No default team found' }, { status: 400 });
        }
        const team = userTeam.teams;
        if (!team.stripe_customer_id) {
            return server_1.NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const portalUrl = await (0, subscription_1.createPortalSession)(team.id, `${origin}/settings/billing`);
        return server_1.NextResponse.json({ url: portalUrl });
    }
    catch (error) {
        console.error('Portal error:', error);
        return server_1.NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map