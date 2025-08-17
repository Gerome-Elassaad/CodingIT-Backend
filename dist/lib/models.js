"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelClient = getModelClient;
exports.getDefaultModelParams = getDefaultModelParams;
const openai_1 = require("@ai-sdk/openai");
const anthropic_1 = require("@ai-sdk/anthropic");
const google_1 = require("@ai-sdk/google");
const mistral_1 = require("@ai-sdk/mistral");
function getModelClient(model, config) {
    const { apiKey, baseURL, ...params } = config;
    switch (model.provider) {
        case 'openai':
            return (0, openai_1.openai)(model.providerId, {
                apiKey: apiKey || process.env.OPENAI_API_KEY,
                baseURL: baseURL
            });
        case 'anthropic':
            return (0, anthropic_1.anthropic)(model.providerId, {
                apiKey: apiKey || process.env.ANTHROPIC_API_KEY
            });
        case 'google':
            return (0, google_1.google)(model.providerId, {
                apiKey: apiKey || process.env.GOOGLE_AI_API_KEY
            });
        case 'mistral':
            return (0, mistral_1.mistral)(model.providerId, {
                apiKey: apiKey || process.env.MISTRAL_API_KEY
            });
        default:
            throw new Error(`Unsupported model provider: ${model.provider}`);
    }
}
function getDefaultModelParams(model) {
    return {
        temperature: 0.7,
        maxTokens: 4000,
        topP: 0.9
    };
}
//# sourceMappingURL=models.js.map