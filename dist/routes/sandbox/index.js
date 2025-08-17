"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sandboxRouter = void 0;
const express_1 = require("express");
const code_interpreter_1 = require("@e2b/code-interpreter");
const errors_1 = require("@/lib/api/errors");
const router = (0, express_1.Router)();
const sandboxTimeout = 10 * 60 * 1000;
// Create and execute sandbox - POST /api/sandbox
router.post('/', async (req, res) => {
    try {
        const { fragment, userID, teamID, accessToken, } = req.body;
        if (!process.env.E2B_API_KEY) {
            console.error('E2B_API_KEY environment variable not found');
            return res.status(500).json({
                error: 'Code execution service is not configured. Please check environment settings.'
            });
        }
        let sbx;
        try {
            // Create sandbox
            try {
                sbx = await code_interpreter_1.Sandbox.create(fragment.template, {
                    metadata: {
                        template: fragment.template,
                        userID: userID ?? '',
                        teamID: teamID ?? '',
                    },
                    timeoutMs: sandboxTimeout,
                    ...(teamID && accessToken
                        ? {
                            headers: {
                                'X-Supabase-Team': teamID,
                                'X-Supabase-Token': accessToken,
                            },
                        }
                        : {}),
                });
                console.log('Sandbox created:', {
                    sandboxId: sbx.sandboxId,
                    template: fragment.template,
                    userID,
                    teamID
                });
            }
            catch (e2bError) {
                console.error('E2B Sandbox creation failed:', e2bError);
                throw (0, errors_1.handleE2BError)(e2bError);
            }
            // Install dependencies if needed
            if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
                try {
                    await sbx.commands.run(fragment.install_dependencies_command);
                }
                catch (dependencyError) {
                    console.error('Dependency installation failed:', dependencyError);
                    throw new errors_1.ApiException('Failed to install additional dependencies', 'execution_error', 500, dependencyError.message);
                }
            }
            // Write code files
            try {
                // Always write main file first (existing behavior)
                if (fragment.code && typeof fragment.code === 'string') {
                    const filePath = fragment.file_path || 'main.py';
                    await sbx.files.write(filePath, fragment.code);
                }
                // Handle legacy array format for existing compatibility
                else if (fragment.code && Array.isArray(fragment.code)) {
                    await Promise.all(fragment.code.map(async (file) => {
                        const filePath = file.file_path || `file_${Math.random().toString(36).substring(2, 9)}.py`;
                        await sbx.files.write(filePath, file.file_content);
                    }));
                }
                // NEW: Handle additional files for multi-file projects (additive feature)
                if (fragment.is_multi_file && fragment.files && fragment.files.length > 0) {
                    console.log('Creating additional files for multi-file project:', fragment.files.length);
                    for (const file of fragment.files) {
                        // Create directory if needed
                        const dirPath = file.file_path.substring(0, file.file_path.lastIndexOf('/'));
                        if (dirPath && dirPath !== '') {
                            try {
                                await sbx.files.makeDir(dirPath);
                            }
                            catch (dirError) {
                                // Directory might already exist, continue
                                console.warn('Directory creation warning:', dirError);
                            }
                        }
                        // Write the file
                        await sbx.files.write(file.file_path, file.file_content);
                    }
                    console.log('Multi-file project created successfully:', {
                        mainFile: fragment.file_path,
                        additionalFiles: fragment.files.length,
                        totalFiles: 1 + fragment.files.length
                    });
                }
                // Ensure we have at least some code
                if (!fragment.code && (!fragment.files || fragment.files.length === 0)) {
                    throw (0, errors_1.createValidationError)('Missing code data');
                }
            }
            catch (fileError) {
                console.error('File write error:', fileError);
                if (fileError instanceof errors_1.ApiException)
                    throw fileError;
                throw new errors_1.ApiException('Failed to write code files to sandbox', 'execution_error', 500, fileError.message);
            }
            // Execute code based on template type
            if (fragment.template === 'code-interpreter-v1') {
                try {
                    const codeToRun = Array.isArray(fragment.code) ? '' : (fragment.code || '');
                    const { logs, error, results } = await sbx.runCode(codeToRun);
                    const response = {
                        sbxId: sbx.sandboxId,
                        template: fragment.template,
                        stdout: logs.stdout,
                        stderr: logs.stderr,
                        runtimeError: error,
                        cellResults: results,
                    };
                    return res.json(response);
                }
                catch (codeError) {
                    console.error('Code execution error:', codeError);
                    throw new errors_1.ApiException('Code execution failed. There may be an error in your code.', 'execution_error', 500, codeError.message);
                }
            }
            // For web applications, start the server
            try {
                if (fragment.install_dependencies_command) {
                    await sbx.commands.run(fragment.install_dependencies_command, {
                        envs: {
                            PORT: (fragment.port || 80).toString(),
                        },
                    });
                }
                const response = {
                    sbxId: sbx.sandboxId,
                    template: fragment.template,
                    url: `https://${sbx.getHost(fragment.port || 80)}`,
                };
                return res.json(response);
            }
            catch (serverError) {
                console.error('Server startup error:', serverError);
                throw new errors_1.ApiException('Failed to start the application server', 'execution_error', 500, serverError.message);
            }
        }
        catch (error) {
            // Clean up sandbox on any error
            if (sbx) {
                try {
                    await sbx.kill();
                    console.log('Sandbox cleaned up due to error:', sbx.sandboxId);
                }
                catch (cleanupError) {
                    console.warn('Failed to cleanup sandbox:', cleanupError);
                }
            }
            if (error instanceof errors_1.ApiException) {
                return res.status(error.statusCode || 500).json({
                    error: error.message,
                    type: error.type
                });
            }
            console.error('Sandbox API Error:', {
                message: error?.message,
                userID,
                teamID,
                template: fragment?.template,
                stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            });
            return res.status(500).json({
                error: 'An unexpected error occurred while setting up the sandbox.',
                details: error?.message || 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Sandbox endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error?.message
        });
    }
});
exports.sandboxRouter = router;
//# sourceMappingURL=index.js.map