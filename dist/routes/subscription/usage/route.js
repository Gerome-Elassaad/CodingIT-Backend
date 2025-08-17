"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const subscription_1 = require("@/lib/subscription");
exports.dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get user's default team
        const { data: userTeam, error: teamError } = await supabase
            .from('users_teams')
            .select('teams (id)')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();
        if (teamError || !userTeam?.teams) {
            console.error('Team lookup failed for user:', user.id, teamError);
            return server_1.NextResponse.json({ error: 'No default team found' }, { status: 400 });
        }
        const team = userTeam.teams;
        const [subscription, usageLimits] = await Promise.all([
            (0, subscription_1.getTeamSubscription)(team.id),
            (0, subscription_1.getTeamUsageLimits)(team.id)
        ]);
        return server_1.NextResponse.json({
            subscription,
            usage_limits: usageLimits
        });
    }
    catch (error) {
        console.error('Usage API error:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map