"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const crypto_1 = __importDefault(require("crypto"));
async function POST(request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-hub-signature-256');
        const event = request.headers.get('x-github-event');
        const delivery = request.headers.get('x-github-delivery');
        if (!verifySignature(body, signature)) {
            console.error('Invalid webhook signature');
            return server_1.NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        const payload = JSON.parse(body);
        console.log(`GitHub webhook received: ${event} (delivery: ${delivery})`);
        switch (event) {
            case 'push':
                await handlePushEvent(payload);
                break;
            case 'pull_request':
                await handlePullRequestEvent(payload);
                break;
            case 'issues':
                await handleIssuesEvent(payload);
                break;
            case 'ping':
                console.log('GitHub webhook ping received');
                break;
            default:
                console.log(`Unhandled GitHub event: ${event}`);
        }
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('GitHub webhook error:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
function verifySignature(body, signature) {
    if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
        return false;
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    return signature === `sha256=${expectedSignature}`;
}
async function handlePushEvent(payload) {
    const supabase = (0, supabase_server_1.createServerClient)();
    const { data: integration } = await supabase
        .from('user_integrations')
        .select('user_id, connection_data')
        .eq('service_name', 'github')
        .eq('connection_data->username', payload.repository.owner.login)
        .single();
    if (integration) {
        const currentData = integration.connection_data || {};
        await supabase
            .from('user_integrations')
            .update({
            last_sync_at: new Date().toISOString(),
            connection_data: {
                ...currentData,
                last_webhook_event: {
                    type: 'push',
                    repository: payload.repository.full_name,
                    branch: payload.ref.replace('refs/heads/', ''),
                    commits: payload.commits.length,
                    timestamp: new Date().toISOString(),
                    pusher: payload.pusher.name,
                },
            },
            updated_at: new Date().toISOString(),
        })
            .eq('user_id', integration.user_id)
            .eq('service_name', 'github');
        console.log(`Push event processed for user ${integration.user_id}`);
    }
}
async function handlePullRequestEvent(payload) {
    const supabase = (0, supabase_server_1.createServerClient)();
    const { data: integration } = await supabase
        .from('user_integrations')
        .select('user_id, connection_data')
        .eq('service_name', 'github')
        .eq('connection_data->username', payload.repository.owner.login)
        .single();
    if (integration) {
        const currentData = integration.connection_data || {};
        await supabase
            .from('user_integrations')
            .update({
            last_sync_at: new Date().toISOString(),
            connection_data: {
                ...currentData,
                last_webhook_event: {
                    type: 'pull_request',
                    action: payload.action,
                    repository: payload.repository.full_name,
                    pr_number: payload.pull_request.number,
                    pr_title: payload.pull_request.title,
                    timestamp: new Date().toISOString(),
                    author: payload.pull_request.user.login,
                },
            },
            updated_at: new Date().toISOString(),
        })
            .eq('user_id', integration.user_id)
            .eq('service_name', 'github');
        console.log(`Pull request ${payload.action} processed for user ${integration.user_id}`);
    }
}
async function handleIssuesEvent(payload) {
    const supabase = (0, supabase_server_1.createServerClient)();
    const { data: integration } = await supabase
        .from('user_integrations')
        .select('user_id, connection_data')
        .eq('service_name', 'github')
        .eq('connection_data->username', payload.repository.owner.login)
        .single();
    if (integration) {
        const currentData = integration.connection_data || {};
        await supabase
            .from('user_integrations')
            .update({
            last_sync_at: new Date().toISOString(),
            connection_data: {
                ...currentData,
                last_webhook_event: {
                    type: 'issues',
                    action: payload.action,
                    repository: payload.repository.full_name,
                    issue_number: payload.issue.number,
                    issue_title: payload.issue.title,
                    timestamp: new Date().toISOString(),
                    author: payload.issue.user.login,
                },
            },
            updated_at: new Date().toISOString(),
        })
            .eq('user_id', integration.user_id)
            .eq('service_name', 'github');
        console.log(`Issue ${payload.action} processed for user ${integration.user_id}`);
    }
}
//# sourceMappingURL=route.js.map