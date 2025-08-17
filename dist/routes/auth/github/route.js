"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.dynamic = void 0;
const zod_1 = require("zod");
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const middleware_1 = require("@/lib/api/middleware");
const validation_1 = require("@/lib/api/validation");
const errors_1 = require("@/lib/api/errors");
// Force dynamic rendering for OAuth callback
exports.dynamic = 'force-dynamic';
const githubCallbackSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Authorization code required'),
    state: zod_1.z.string().min(1, 'State parameter required'),
    error: zod_1.z.string().optional()
});
exports.GET = (0, middleware_1.createPublicApiRoute)(async ({ request }) => {
    const searchParams = (0, validation_1.validateSearchParams)(new URL(request.url), githubCallbackSchema.partial());
    if (searchParams.error) {
        console.error('GitHub OAuth error:', searchParams.error);
        return server_1.NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent('GitHub authentication failed')}`, request.url));
    }
    if (!searchParams.code || !searchParams.state) {
        return server_1.NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent('Missing authorization code')}`, request.url));
    }
    const supabase = (0, supabase_server_1.createServerClient)();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('User authentication failed:', authError);
        return server_1.NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent('User not authenticated')}`, request.url));
    }
    try {
        // Exchange code for access token
        const tokenData = await exchangeGitHubCode(searchParams.code, searchParams.state);
        // Fetch GitHub user information
        const githubUser = await fetchGitHubUser(tokenData.access_token);
        // Save integration to database
        await saveGitHubIntegration(supabase, user.id, tokenData, githubUser);
        // Setup webhooks (non-blocking)
        setupWebhooks(tokenData.access_token, githubUser.login).catch(error => {
            console.warn('Webhook setup failed:', error);
        });
        console.log('GitHub integration successful:', {
            userId: user.id,
            githubUsername: githubUser.login,
            githubUserId: githubUser.id
        });
        return server_1.NextResponse.redirect(new URL('/settings/integrations?success=github_connected', request.url));
    }
    catch (error) {
        console.error('GitHub OAuth error:', {
            message: error?.message,
            userId: user?.id,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
        const errorMessage = error instanceof errors_1.ApiException
            ? error.message
            : 'Internal server error';
        return server_1.NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`, request.url));
    }
}, {
    security: { enableSecurityHeaders: true },
    validation: {
        environmentVars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
    }
});
async function exchangeGitHubCode(code, state) {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            state,
        }),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error || !tokenData.access_token) {
        console.error('GitHub token exchange error:', tokenData.error);
        throw new errors_1.ApiException('Failed to exchange authorization code', tokenData.error_description);
    }
    return tokenData;
}
async function fetchGitHubUser(accessToken) {
    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    const githubUser = await userResponse.json();
    if (!userResponse.ok) {
        console.error('GitHub user fetch error:', githubUser);
        throw new errors_1.ApiException('Failed to fetch user information from GitHub', githubUser.message);
    }
    return githubUser;
}
async function saveGitHubIntegration(supabase, userId, tokenData, githubUser) {
    const { error: dbError } = await supabase
        .from('user_integrations')
        .upsert({
        user_id: userId,
        service_name: 'github',
        is_connected: true,
        connection_data: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            github_user_id: githubUser.id,
            username: githubUser.login,
            avatar_url: githubUser.avatar_url,
            connected_at: new Date().toISOString(),
        },
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });
    if (dbError) {
        console.error('Database error saving GitHub integration:', dbError);
        throw (0, errors_1.handleDatabaseError)(dbError);
    }
}
async function setupWebhooks(accessToken, _username) {
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/github`;
    const reposResponse = await fetch(`https://api.github.com/user/repos?type=owner&per_page=10`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    if (reposResponse.ok) {
        const repos = await reposResponse.json();
        for (const repo of repos.slice(0, 3)) {
            try {
                await fetch(`https://api.github.com/repos/${repo.full_name}/hooks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: 'web',
                        active: true,
                        events: ['push', 'pull_request', 'issues'],
                        config: {
                            url: webhookUrl,
                            content_type: 'json',
                            insecure_ssl: '0',
                            secret: process.env.GITHUB_WEBHOOK_SECRET,
                        },
                    }),
                });
            }
            catch (error) {
                console.warn(`Failed to setup webhook for ${repo.full_name}:`, error);
            }
        }
    }
}
//# sourceMappingURL=route.js.map