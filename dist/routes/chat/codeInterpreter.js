"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateCode = evaluateCode;
exports.nonEmpty = nonEmpty;
require("server-only");
const code_interpreter_1 = require("@e2b/code-interpreter");
const E2B_API_KEY = process.env.E2B_API_KEY;
const sandboxTimeout = 10 * 60 * 1000;
async function evaluateCode(sessionID, code) {
    if (!E2B_API_KEY) {
        throw new Error('E2B_API_KEY environment variable not found');
    }
    const sandbox = await getSandbox(sessionID);
    const execution = await sandbox.runCode(code, {});
    return {
        results: execution.results,
        stdout: execution.logs.stdout,
        stderr: execution.logs.stderr,
        error: execution.error,
    };
}
async function getSandbox(sessionID) {
    if (!E2B_API_KEY) {
        throw new Error('E2B_API_KEY environment variable not found');
    }
    const sandboxes = await code_interpreter_1.Sandbox.list();
    const sandboxID = sandboxes.find(sandbox => sandbox.metadata?.sessionID === sessionID)?.sandboxId;
    if (sandboxID) {
        const sandbox = await code_interpreter_1.Sandbox.connect(sandboxID, {
            apiKey: E2B_API_KEY,
        });
        await sandbox.setTimeout(sandboxTimeout);
        return sandbox;
    }
    else {
        const sandbox = await code_interpreter_1.Sandbox.create({
            apiKey: E2B_API_KEY,
            metadata: {
                sessionID,
            },
            timeoutMs: sandboxTimeout
        });
        return sandbox;
    }
}
function nonEmpty(value) {
    return value !== null && value !== undefined;
}
//# sourceMappingURL=codeInterpreter.js.map