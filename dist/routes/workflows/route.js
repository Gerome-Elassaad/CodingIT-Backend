"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const workflow_persistence_1 = require("@/lib/workflow-persistence");
exports.dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const teamId = searchParams.get('team_id') || session.user.id;
        const result = await workflow_persistence_1.workflowPersistence.listWorkflows(teamId, limit, offset);
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        console.error('Error listing workflows:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, description, fragments, connections, variables, triggers } = body;
        if (!name || !fragments) {
            return server_1.NextResponse.json({ error: 'Name and fragments are required' }, { status: 400 });
        }
        const workflow = await workflow_persistence_1.workflowPersistence.createWorkflow({
            name,
            description,
            fragments: fragments || [],
            connections: connections || [],
            variables: variables || [],
            triggers: triggers || [],
            version: 1
        }, session.user.id);
        return server_1.NextResponse.json(workflow, { status: 201 });
    }
    catch (error) {
        console.error('Error creating workflow:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map