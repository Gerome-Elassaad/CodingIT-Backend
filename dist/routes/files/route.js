"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const code_interpreter_1 = require("@e2b/code-interpreter");
async function listFilesRecursively(sandbox, path) {
    const files = await sandbox.files.list(path);
    const nodes = [];
    for (const file of files) {
        const fullPath = `${path}/${file.name}`;
        if (file.type === code_interpreter_1.FileType.DIR) {
            nodes.push({
                name: file.name,
                isDirectory: true,
                children: await listFilesRecursively(sandbox, fullPath),
            });
        }
        else {
            nodes.push({
                name: file.name,
                isDirectory: false,
                path: fullPath,
            });
        }
    }
    return nodes;
}
const E2B_API_KEY = process.env.E2B_API_KEY;
const sandboxTimeout = 10 * 60 * 1000;
async function getSandbox(sessionID, template) {
    if (!E2B_API_KEY) {
        throw new Error('E2B_API_KEY environment variable not found');
    }
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
async function GET(request) {
    const searchParams = request.nextUrl.searchParams;
    const sessionID = searchParams.get('sessionID');
    const template = searchParams.get('template');
    if (!sessionID) {
        return server_1.NextResponse.json({ error: 'sessionID is required' }, { status: 400 });
    }
    try {
        const sandbox = await getSandbox(sessionID, template || undefined);
        const fileTree = await listFilesRecursively(sandbox, '/');
        return server_1.NextResponse.json(fileTree);
    }
    catch (error) {
        console.error('Error fetching file tree:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch file tree' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map