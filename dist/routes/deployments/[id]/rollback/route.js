"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const deployment_engine_1 = require("@/lib/deployment/deployment-engine");
exports.dynamic = 'force-dynamic';
async function POST(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const rolledBack = await deployment_engine_1.deploymentEngine.rollbackDeployment(params.id);
        if (!rolledBack) {
            return server_1.NextResponse.json({ error: 'Deployment cannot be rolled back' }, { status: 400 });
        }
        return server_1.NextResponse.json({ success: true, message: 'Deployment rolled back' });
    }
    catch (error) {
        console.error('Error rolling back deployment:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map