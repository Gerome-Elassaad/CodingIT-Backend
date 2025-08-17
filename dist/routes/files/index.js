"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesRouter = void 0;
const express_1 = require("express");
const code_interpreter_1 = require("@e2b/code-interpreter");
const router = (0, express_1.Router)();
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
// Get file tree - GET /api/files
router.get('/', async (req, res) => {
    const sessionID = req.query.sessionID;
    const template = req.query.template;
    if (!sessionID) {
        return res.status(400).json({
            error: 'sessionID is required'
        });
    }
    try {
        const sandbox = await getSandbox(sessionID, template || undefined);
        const fileTree = await listFilesRecursively(sandbox, '/');
        return res.json(fileTree);
    }
    catch (error) {
        console.error('Error fetching file tree:', error);
        return res.status(500).json({
            error: 'Failed to fetch file tree'
        });
    }
});
exports.filesRouter = router;
//# sourceMappingURL=index.js.map