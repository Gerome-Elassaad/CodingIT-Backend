"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
async function POST(request) {
    try {
        const { access_token } = await request.json();
        const supabase = (0, supabase_server_1.createServerClient)();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!access_token) {
            return server_1.NextResponse.json({ error: 'Access token required' }, { status: 400 });
        }
        const response = await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64')}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                access_token,
            }),
        });
        if (response.ok || response.status === 404) {
            const { error: dbError } = await supabase
                .from('user_integrations')
                .update({
                is_connected: false,
                connection_data: {},
                updated_at: new Date().toISOString(),
            })
                .eq('user_id', session.user.id)
                .eq('service_name', 'github');
            if (dbError) {
                console.error('Database error during revocation:', dbError);
                return server_1.NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
            }
            return server_1.NextResponse.json({ success: true });
        }
        else {
            const errorText = await response.text();
            console.error('GitHub token revocation failed:', response.status, errorText);
            return server_1.NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
        }
    }
    catch (error) {
        console.error('Error revoking GitHub token:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map