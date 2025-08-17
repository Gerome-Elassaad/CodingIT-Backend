"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.maxDuration = void 0;
const zod_1 = require("zod");
const models_1 = require("@/lib/models");
const prompt_1 = require("@/lib/prompt");
const schema_1 = require("@/lib/schema");
const ai_1 = require("ai");
const middleware_1 = require("@/lib/api/middleware");
const validation_1 = require("@/lib/api/validation");
const errors_1 = require("@/lib/api/errors");
exports.maxDuration = 300;
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    : 10;
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
    ? process.env.RATE_LIMIT_WINDOW
    : '1d';
const chatRequestSchema = zod_1.z.object({
    messages: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant', 'system']),
        content: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.any())]) // Allow both string and array content
    })),
    userID: zod_1.z.string().optional(),
    teamID: zod_1.z.string().optional(),
    template: zod_1.z.union([zod_1.z.string(), zod_1.z.object({}).passthrough()]), // Allow both string and object
    model: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        provider: zod_1.z.string(),
        providerId: zod_1.z.string(),
        isBeta: zod_1.z.boolean().optional()
    }),
    config: zod_1.z.object({
        model: zod_1.z.string().optional(),
        apiKey: zod_1.z.string().optional(),
        baseURL: zod_1.z.string().url().optional(),
        temperature: zod_1.z.number().min(0).max(2).optional(),
        topP: zod_1.z.number().min(0).max(1).optional(),
        topK: zod_1.z.number().min(1).optional(),
        frequencyPenalty: zod_1.z.number().min(-2).max(2).optional(),
        presencePenalty: zod_1.z.number().min(-2).max(2).optional(),
        maxTokens: zod_1.z.number().min(1).max(100000).optional()
    })
});
exports.POST = (0, middleware_1.createRateLimitedApiRoute)(async ({ request }) => {
    const { messages, userID, teamID, template, model, config, } = await (0, validation_1.validateJsonBody)(request, chatRequestSchema);
    console.log('Chat request:', {
        userID,
        teamID,
        modelId: model.id,
        provider: model.provider,
        hasApiKey: !!config.apiKey
    });
    const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config;
    // Handle template conversion - extract template name from object or use string directly
    const templateName = typeof template === 'string' ? template : template?.name || 'code-interpreter-v1';
    try {
        const modelClient = (0, models_1.getModelClient)(model, config);
        const stream = (0, ai_1.streamObject)({
            model: modelClient,
            schema: schema_1.fragmentSchema,
            system: (0, prompt_1.toPrompt)(templateName),
            messages: messages,
            maxRetries: 0,
            ...(0, models_1.getDefaultModelParams)(model),
            ...modelParams,
        });
        return stream.toTextStreamResponse();
    }
    catch (error) {
        console.error('Chat API Error:', {
            message: error?.message,
            status: error?.statusCode,
            provider: model.provider,
            modelId: model.id,
            userID,
            teamID,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
        const aiError = (0, errors_1.handleAIProviderError)(error);
        return (0, errors_1.createErrorResponse)(aiError);
    }
}, {
    max: rateLimitMaxRequests,
    window: ratelimitWindow,
    skipWithApiKey: true
}, {
    security: { enableSecurityHeaders: true },
    validation: {
        maxBodySize: 1024 * 1024 // 1MB
    }
});
//# sourceMappingURL=route.js.map