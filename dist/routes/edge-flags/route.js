"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const edge_config_adapter_1 = require("@/lib/edge-config-adapter");
const flags_1 = require("@/flags");
exports.dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const url = new URL(request.url);
        const useEdgeConfig = url.searchParams.get('edge') === 'true';
        const featureKey = url.searchParams.get('feature');
        if (useEdgeConfig) {
            if (featureKey) {
                const value = await edge_config_adapter_1.edgeConfigAdapter.getFeatureValue(featureKey);
                return server_1.NextResponse.json({
                    success: true,
                    source: 'edge-config',
                    feature: featureKey,
                    value,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                const features = await edge_config_adapter_1.edgeConfigAdapter.getAllFeatures();
                const featureData = await edge_config_adapter_1.edgeConfigAdapter.getFeatureData();
                return server_1.NextResponse.json({
                    success: true,
                    source: 'edge-config',
                    features,
                    metadata: {
                        featuresCount: Object.keys(features).length,
                        dateUpdated: featureData?.dateUpdated,
                        cached: true,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
        }
        else {
            const flags = await (0, flags_1.getAllFeatureFlags)();
            return server_1.NextResponse.json({
                success: true,
                source: 'growthbook-standard',
                flags,
                metadata: {
                    flagsCount: Object.keys(flags).length,
                    cached: false,
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        console.error('Error in edge-flags API:', error);
        return server_1.NextResponse.json({
            success: false,
            source: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { features, context } = body;
        if (!features || !Array.isArray(features)) {
            return server_1.NextResponse.json({ error: 'Invalid request: features array required' }, { status: 400 });
        }
        const results = {};
        for (const featureKey of features) {
            results[featureKey] = await edge_config_adapter_1.edgeConfigAdapter.getFeatureValue(featureKey, false, context);
        }
        return server_1.NextResponse.json({
            success: true,
            source: 'edge-config',
            features: results,
            context,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error in batch feature check:', error);
        return server_1.NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map