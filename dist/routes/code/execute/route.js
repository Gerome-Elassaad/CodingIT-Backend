"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const codeInterpreter_1 = require("@/app/api/chat/codeInterpreter");
async function POST(req) {
    try {
        const { sessionID, code } = await req.json();
        if (!sessionID || !code) {
            return server_1.NextResponse.json({ error: 'sessionID and code are required' }, { status: 400 });
        }
        const result = await (0, codeInterpreter_1.evaluateCode)(sessionID, code);
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map