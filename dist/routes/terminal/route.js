"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxDuration = void 0;
exports.POST = POST;
const code_interpreter_1 = require("@e2b/code-interpreter");
const server_1 = require("next/server");
exports.maxDuration = 60;
async function POST(req) {
    try {
        const { command, sbxId, workingDirectory = '/home/user', teamID, accessToken } = await req.json();
        if (!command || !sbxId) {
            return server_1.NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const sandbox = await code_interpreter_1.Sandbox.connect(sbxId, {
            ...(teamID && accessToken
                ? {
                    headers: {
                        'X-Supabase-Team': teamID,
                        'X-Supabase-Token': accessToken,
                    },
                }
                : {}),
        });
        const fullCommand = `cd "${workingDirectory}" && ${command}`;
        const result = await sandbox.commands.run(fullCommand, {
            timeoutMs: 30000,
        });
        return server_1.NextResponse.json({
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            workingDirectory,
        });
    }
    catch (error) {
        console.error('Terminal command error:', error);
        return server_1.NextResponse.json({
            error: error.message || 'Failed to execute command',
            stderr: error.message || 'Command execution failed'
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map