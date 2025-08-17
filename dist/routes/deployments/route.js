"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
const deployment_engine_1 = require("@/lib/deployment/deployment-engine");
exports.dynamic = 'force-dynamic';
async function POST(request) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { fragment, config } = body;
        if (!fragment || !config) {
            return server_1.NextResponse.json({ error: 'Fragment and config are required' }, { status: 400 });
        }
        const fragmentData = fragment;
        if (!fragmentData.template || !fragmentData.code) {
            return server_1.NextResponse.json({ error: 'Fragment must have template and code' }, { status: 400 });
        }
        const deploymentResult = await deployment_engine_1.deploymentEngine.deployFragment(fragmentData, config);
        return server_1.NextResponse.json(deploymentResult);
    }
    catch (error) {
        console.error('Error deploying fragment:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function GET(request) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const searchParams = request.nextUrl.searchParams;
        const fragmentId = searchParams.get('fragment_id');
        if (fragmentId) {
            const history = deployment_engine_1.deploymentEngine.getDeploymentHistory(fragmentId);
            return server_1.NextResponse.json({ deployments: history });
        }
        return server_1.NextResponse.json({ deployments: [] });
    }
    catch (error) {
        console.error('Error listing deployments:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map