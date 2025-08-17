"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const flags_1 = require("@/flags");
exports.dynamic = 'force-dynamic';
async function GET(request) {
    try {
        const flags = await (0, flags_1.getAllFeatureFlags)();
        return server_1.NextResponse.json({
            success: true,
            flags,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching feature flags:', error);
        return server_1.NextResponse.json({
            success: false,
            error: 'Failed to fetch feature flags',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map