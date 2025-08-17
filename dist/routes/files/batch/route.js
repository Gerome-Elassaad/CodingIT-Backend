"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const code_interpreter_1 = require("@e2b/code-interpreter");
const middleware_1 = require("@/lib/api/middleware");
const validation_1 = require("@/lib/api/validation");
const errors_1 = require("@/lib/api/errors");
const zod_1 = require("zod");
const E2B_API_KEY = process.env.E2B_API_KEY;
const batchFileSchema = zod_1.z.object({
    sandboxId: zod_1.z.string(),
    files: zod_1.z.array(zod_1.z.object({
        file_path: zod_1.z.string(),
        file_content: zod_1.z.string(),
    })),
});
async function ensureDirectoryExists(sandbox, filePath) {
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dirPath && dirPath !== '') {
        try {
            await sandbox.files.makeDir(dirPath);
        }
        catch (error) {
            // Directory might already exist, continue
        }
    }
}
exports.POST = (0, middleware_1.createProtectedApiRoute)(async ({ request }) => {
    if (!E2B_API_KEY) {
        return (0, errors_1.createErrorResponse)(new errors_1.ApiException('E2B_API_KEY environment variable not found', 'configuration_error', 500));
    }
    try {
        const { sandboxId, files } = await (0, validation_1.validateJsonBody)(request, batchFileSchema);
        const sandbox = await code_interpreter_1.Sandbox.connect(sandboxId, {
            apiKey: E2B_API_KEY,
        });
        const results = [];
        for (const file of files) {
            try {
                await ensureDirectoryExists(sandbox, file.file_path);
                await sandbox.files.write(file.file_path, file.file_content);
                results.push({
                    path: file.file_path,
                    success: true,
                    size: file.file_content.length
                });
            }
            catch (error) {
                results.push({
                    path: file.file_path,
                    success: false,
                    error: error.message
                });
            }
        }
        await sandbox.kill();
        return server_1.NextResponse.json({
            success: true,
            files: results,
            totalFiles: files.length,
            successCount: results.filter(r => r.success).length
        });
    }
    catch (error) {
        console.error('Batch file creation error:', {
            message: error?.message,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
        return (0, errors_1.createErrorResponse)(new errors_1.ApiException(error.message || 'Failed to create files', 'operation_error', 500));
    }
}, {
    security: { enableSecurityHeaders: true },
    validation: {
        maxBodySize: 5 * 1024 * 1024 // 5MB for multiple files
    }
});
//# sourceMappingURL=route.js.map