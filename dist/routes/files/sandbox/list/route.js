"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const code_interpreter_1 = require("@e2b/code-interpreter");
exports.dynamic = 'force-dynamic';
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
async function GET(request) {
    if (!E2B_API_KEY) {
        return server_1.NextResponse.json({ error: 'E2B_API_KEY environment variable not found' }, { status: 500 });
    }
    try {
        const searchParams = request.nextUrl.searchParams;
        const sandboxId = searchParams.get('sandboxId');
        if (!sandboxId) {
            return server_1.NextResponse.json({ error: 'sandboxId is required' }, { status: 400 });
        }
        const sandbox = await code_interpreter_1.Sandbox.connect(sandboxId, {
            apiKey: E2B_API_KEY,
        });
        const fileTree = await listFilesRecursively(sandbox, '/');
        return server_1.NextResponse.json(fileTree);
    }
    catch (error) {
        console.error('Error fetching file tree:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch file tree' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map