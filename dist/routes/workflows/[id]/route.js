"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const workflow_persistence_1 = require("@/lib/workflow-persistence");
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const workflow = await workflow_persistence_1.workflowPersistence.getWorkflow(params.id);
        if (!workflow) {
            return server_1.NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        return server_1.NextResponse.json(workflow);
    }
    catch (error) {
        console.error('Error fetching workflow:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function PUT(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, description, fragments, connections, variables, triggers, version } = body;
        const workflow = await workflow_persistence_1.workflowPersistence.updateWorkflow(params.id, {
            name,
            description,
            fragments,
            connections,
            variables,
            triggers,
            version: version || 1,
            updated_at: new Date()
        });
        return server_1.NextResponse.json(workflow);
    }
    catch (error) {
        console.error('Error updating workflow:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function DELETE(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await workflow_persistence_1.workflowPersistence.deleteWorkflow(params.id);
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting workflow:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map