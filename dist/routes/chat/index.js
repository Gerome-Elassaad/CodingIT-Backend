"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const models_1 = require("@/lib/models");
const prompt_1 = require("@/lib/prompt");
const schema_1 = require("@/lib/schema");
const ai_1 = require("ai");
const errors_1 = require("@/lib/api/errors");
const ratelimit_1 = __importDefault(require("@/lib/ratelimit"));
const templates_1 = __importDefault(require("@/lib/templates"));
const workflow_detector_1 = require("@/lib/workflow-detector");
const workflow_persistence_1 = require("@/lib/workflow-persistence");
const fragment_node_mapper_1 = require("@/lib/fragment-node-mapper");
const router = (0, express_1.Router)();
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
const workflowResponseSchema = zod_1.z.object({
    type: zod_1.z.enum(['fragment', 'workflow']).describe('Whether this should be a single fragment or a multi-step workflow'),
    workflowSuggestion: zod_1.z.object({
        name: zod_1.z.string().describe('Suggested name for the workflow'),
        description: zod_1.z.string().describe('Description of what the workflow does'),
        reasoning: zod_1.z.string().describe('Why this should be a workflow instead of a single fragment')
    }).optional().describe('Workflow suggestion if type is workflow'),
    fragment: schema_1.fragmentSchema.optional().describe('Fragment data if type is fragment'),
    workflowSteps: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        template: zod_1.z.string(),
        code: zod_1.z.string(),
        dependencies: zod_1.z.array(zod_1.z.string()).default([])
    })).optional().describe('Workflow steps if type is workflow')
});
// Regular chat endpoint - POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { messages, userID, teamID, template, model, config, } = req.body;
        // Validate the request body
        const validation = chatRequestSchema.safeParse({
            messages,
            userID,
            teamID,
            template,
            model,
            config,
        });
        if (!validation.success) {
            return res.status(400).json({
                error: 'Invalid request body',
                details: validation.error.issues
            });
        }
        console.log('Chat request:', {
            userID,
            teamID,
            modelId: model.id,
            provider: model.provider,
            hasApiKey: !!config.apiKey
        });
        // Rate limiting
        const limit = !config.apiKey
            ? await (0, ratelimit_1.default)(req.headers['x-forwarded-for'] || req.ip, rateLimitMaxRequests, ratelimitWindow)
            : false;
        if (limit) {
            return res.status(429).json({
                error: 'You have reached your request limit for the day.',
                headers: {
                    'X-RateLimit-Limit': limit.amount.toString(),
                    'X-RateLimit-Remaining': limit.remaining.toString(),
                    'X-RateLimit-Reset': limit.reset.toString(),
                }
            });
        }
        const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config;
        // Handle template conversion - extract template name from object or use string directly
        const templateName = typeof template === 'string' ? template : template?.name || 'code-interpreter-v1';
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
        // Set appropriate headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Pipe the stream to the response
        const textStream = stream.toTextStreamResponse();
        const reader = textStream.body?.getReader();
        if (reader) {
            const pump = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        res.write(value);
                    }
                    res.end();
                }
                catch (error) {
                    console.error('Stream error:', error);
                    res.end();
                }
            };
            pump();
        }
        else {
            res.status(500).json({ error: 'Failed to create stream' });
        }
    }
    catch (error) {
        console.error('Chat API Error:', {
            message: error?.message,
            status: error?.statusCode,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
        const aiError = (0, errors_1.handleAIProviderError)(error);
        return res.status(aiError.statusCode || 500).json({
            error: aiError.message,
            type: aiError.type
        });
    }
});
// Workflow chat endpoint - POST /api/chat/workflow
router.post('/workflow', async (req, res) => {
    try {
        const { messages, userID, teamID, template, model, config, } = req.body;
        const limit = !config.apiKey
            ? await (0, ratelimit_1.default)(req.headers['x-forwarded-for'] || req.ip, rateLimitMaxRequests, ratelimitWindow)
            : false;
        if (limit) {
            return res.status(429).json({
                error: 'You have reached your request limit for the day.',
                headers: {
                    'X-RateLimit-Limit': limit.amount.toString(),
                    'X-RateLimit-Remaining': limit.remaining.toString(),
                    'X-RateLimit-Reset': limit.reset.toString(),
                }
            });
        }
        const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config;
        const modelClient = (0, models_1.getModelClient)(model, config);
        const detection = workflow_detector_1.workflowDetector.detectWorkflow(messages);
        const basePrompt = (0, prompt_1.toPrompt)(templates_1.default);
        const workflowPrompt = detection.isWorkflow
            ? `\n\nIMPORTANT: This request appears to be a multi-step workflow with ${detection.confidence * 100}% confidence. 
Consider breaking it down into multiple connected steps instead of a single fragment.

Detected workflow suggestion:
- Name: ${detection.suggestedName}
- Description: ${detection.suggestedDescription}
- Reason: ${detection.reason}

If you determine this should be a workflow, respond with type: "workflow" and provide workflowSteps.
If it should remain a single fragment, respond with type: "fragment" and provide fragment.`
            : '\n\nThis appears to be a single-step request. Create a single fragment unless the user explicitly requests multiple steps.';
        const systemPrompt = basePrompt + workflowPrompt;
        const stream = await (0, ai_1.streamObject)({
            model: modelClient,
            schema: workflowResponseSchema,
            system: systemPrompt,
            messages,
            maxRetries: 0,
            ...modelParams,
        });
        if (userID) {
            stream.object.then(async (response) => {
                if (response?.type === 'workflow' && response.workflowSteps) {
                    try {
                        await createWorkflowFromSteps(response, userID, teamID);
                    }
                    catch (error) {
                        console.error('Error processing workflow creation:', error);
                    }
                }
            }).catch(() => { });
        }
        // Set appropriate headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Pipe the stream to the response
        const textStream = stream.toTextStreamResponse();
        const reader = textStream.body?.getReader();
        if (reader) {
            const pump = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        res.write(value);
                    }
                    res.end();
                }
                catch (error) {
                    console.error('Stream error:', error);
                    res.end();
                }
            };
            pump();
        }
        else {
            res.status(500).json({ error: 'Failed to create stream' });
        }
    }
    catch (error) {
        const isRateLimitError = error && (error.statusCode === 429 || error.message.includes('limit'));
        const isOverloadedError = error && (error.statusCode === 529 || error.statusCode === 503);
        const isAccessDeniedError = error && (error.statusCode === 403 || error.statusCode === 401);
        if (isRateLimitError) {
            return res.status(429).json({
                error: 'The provider is currently unavailable due to request limit. Try using your own API key.'
            });
        }
        if (isOverloadedError) {
            return res.status(529).json({
                error: 'The provider is currently unavailable. Please try again later.'
            });
        }
        if (isAccessDeniedError) {
            return res.status(403).json({
                error: 'Access denied. Please make sure your API key is valid.'
            });
        }
        return res.status(500).json({
            error: 'An unexpected error has occurred. Please try again later.'
        });
    }
});
async function createWorkflowFromSteps(response, userID, teamID) {
    try {
        const fragments = response.workflowSteps.map((step, index) => {
            const fragmentSchema = {
                commentary: `Step ${index + 1}: ${step.name}`,
                template: step.template,
                title: step.name,
                description: step.description,
                additional_dependencies: [],
                has_additional_dependencies: false,
                install_dependencies_command: '',
                port: null,
                file_path: 'main.py',
                code: step.code
            };
            const node = fragment_node_mapper_1.fragmentNodeMapper.fragmentToNode(fragmentSchema, { x: 100 + (index * 200), y: 100 });
            node.id = `node_${index + 1}`;
            node.dependencies = step.dependencies || (index === 0 ? [] : [`node_${index}`]);
            return node;
        });
        const connections = fragments.slice(1).map((fragment, index) => ({
            id: `conn_${index + 1}`,
            source: {
                nodeId: fragments[index].id,
                portId: 'output_1'
            },
            target: {
                nodeId: fragment.id,
                portId: 'input_1'
            },
            dataType: 'object'
        }));
        const workflow = {
            name: response.workflowSuggestion?.name || 'AI Generated Workflow',
            description: response.workflowSuggestion?.description || 'Multi-step workflow created by AI',
            fragments,
            connections,
            variables: [],
            triggers: [
                {
                    id: 'trigger_1',
                    type: 'manual',
                    config: {}
                }
            ],
            version: 1
        };
        await workflow_persistence_1.workflowPersistence.createWorkflow(workflow, teamID || userID);
    }
    catch (error) {
        console.error('Error creating workflow from steps:', error);
    }
}
exports.chatRouter = router;
//# sourceMappingURL=index.js.map