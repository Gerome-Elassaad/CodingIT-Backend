"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const workflow_persistence_1 = require("@/lib/workflow-persistence");
const workflow_engine_1 = require("@/lib/workflow-engine");
exports.dynamic = 'force-dynamic';
async function POST(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { inputData = {}, triggerType = 'manual' } = body;
        const workflow = await workflow_persistence_1.workflowPersistence.getWorkflow(params.id);
        if (!workflow) {
            return server_1.NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        const execution = await workflow_engine_1.workflowEngine.executeWorkflow(workflow, inputData, triggerType);
        await workflow_persistence_1.workflowPersistence.createExecution(execution);
        return server_1.NextResponse.json({
            executionId: execution.id,
            status: execution.status,
            message: 'Workflow execution started'
        });
    }
    catch (error) {
        console.error('Error executing workflow:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function GET(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const searchParams = request.nextUrl.searchParams;
        const executionId = searchParams.get('execution_id');
        if (executionId) {
            const execution = await workflow_persistence_1.workflowPersistence.getExecution(executionId);
            if (!execution) {
                return server_1.NextResponse.json({ error: 'Execution not found' }, { status: 404 });
            }
            return server_1.NextResponse.json(execution);
        }
        else {
            const limit = parseInt(searchParams.get('limit') || '50');
            const offset = parseInt(searchParams.get('offset') || '0');
            const result = await workflow_persistence_1.workflowPersistence.listExecutions(params.id, limit, offset);
            return server_1.NextResponse.json(result);
        }
    }
    catch (error) {
        console.error('Error fetching executions:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map