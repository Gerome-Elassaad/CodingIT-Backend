"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const deployment_engine_1 = require("@/lib/deployment/deployment-engine");
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const status = deployment_engine_1.deploymentEngine.getDeploymentStatus(params.id);
        if (!status) {
            return server_1.NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
        }
        return server_1.NextResponse.json(status);
    }
    catch (error) {
        console.error('Error fetching deployment status:', error);
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
        const cancelled = await deployment_engine_1.deploymentEngine.cancelDeployment(params.id);
        if (!cancelled) {
            return server_1.NextResponse.json({ error: 'Deployment cannot be cancelled' }, { status: 400 });
        }
        return server_1.NextResponse.json({ success: true, message: 'Deployment cancelled' });
    }
    catch (error) {
        console.error('Error cancelling deployment:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map