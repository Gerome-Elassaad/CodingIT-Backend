"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const code_interpreter_1 = require("@e2b/code-interpreter");
const E2B_API_KEY = process.env.E2B_API_KEY;
const sandboxTimeout = 10 * 60 * 1000;
async function getSandbox(sessionID, template) {
    const sandbox = await code_interpreter_1.Sandbox.create(template || 'code-interpreter-v1', {
        apiKey: E2B_API_KEY,
        metadata: {
            sessionID,
            template: template || 'code-interpreter-v1',
        },
        timeoutMs: sandboxTimeout,
    });
    return sandbox;
}
async function GET(req) {
    try {
        if (!E2B_API_KEY) {
            return server_1.NextResponse.json({ error: 'E2B_API_KEY environment variable not found' }, { status: 500 });
        }
        const { searchParams } = new URL(req.url);
        const sessionID = searchParams.get('sessionID');
        const path = searchParams.get('path');
        const template = searchParams.get('template');
        if (!sessionID || !path) {
            return server_1.NextResponse.json({ error: 'sessionID and path are required' }, { status: 400 });
        }
        const sandbox = await getSandbox(sessionID, template || undefined);
        const content = await sandbox.files.read(path);
        return server_1.NextResponse.json({ content });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
async function POST(req) {
    try {
        const { sessionID, path, content, template } = await req.json();
        if (!sessionID || !path || content === undefined) {
            return server_1.NextResponse.json({ error: 'sessionID, path and content are required' }, { status: 400 });
        }
        const sandbox = await getSandbox(sessionID, template || undefined);
        await sandbox.files.write(path, content);
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map