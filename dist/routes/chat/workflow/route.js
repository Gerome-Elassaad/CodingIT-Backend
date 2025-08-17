"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxDuration = void 0;
exports.POST = POST;
const models_1 = require("@/lib/models");
const prompt_1 = require("@/lib/prompt");
const ratelimit_1 = __importDefault(require("@/lib/ratelimit"));
const schema_1 = require("@/lib/schema");
const templates_1 = __importDefault(require("@/lib/templates"));
const workflow_detector_1 = require("@/lib/workflow-detector");
const workflow_persistence_1 = require("@/lib/workflow-persistence");
const fragment_node_mapper_1 = require("@/lib/fragment-node-mapper");
const ai_1 = require("ai");
const zod_1 = require("zod");
exports.maxDuration = 60;
const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    : 10;
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
    ? process.env.RATE_LIMIT_WINDOW
    : '1d';
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
async function POST(req) {
    const { messages, userID, teamID, template, model, config, } = await req.json();
    const limit = !config.apiKey
        ? await (0, ratelimit_1.default)(req.headers.get('x-forwarded-for'), rateLimitMaxRequests, ratelimitWindow)
        : false;
    if (limit) {
        return new Response('You have reached your request limit for the day.', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.amount.toString(),
                'X-RateLimit-Remaining': limit.remaining.toString(),
                'X-RateLimit-Reset': limit.reset.toString(),
            },
        });
    }
    const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config;
    const modelClient = (0, models_1.getModelClient)(model, config);
    try {
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
        return stream.toTextStreamResponse();
    }
    catch (error) {
        const isRateLimitError = error && (error.statusCode === 429 || error.message.includes('limit'));
        const isOverloadedError = error && (error.statusCode === 529 || error.statusCode === 503);
        const isAccessDeniedError = error && (error.statusCode === 403 || error.statusCode === 401);
        if (isRateLimitError) {
            return new Response('The provider is currently unavailable due to request limit. Try using your own API key.', { status: 429 });
        }
        if (isOverloadedError) {
            return new Response('The provider is currently unavailable. Please try again later.', { status: 529 });
        }
        if (isAccessDeniedError) {
            return new Response('Access denied. Please make sure your API key is valid.', { status: 403 });
        }
        return new Response('An unexpected error has occurred. Please try again later.', { status: 500 });
    }
}
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
    }
}
//# sourceMappingURL=route.js.map