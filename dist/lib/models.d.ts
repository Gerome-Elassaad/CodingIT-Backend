import { LanguageModel } from 'ai';
export interface LLMModel {
    id: string;
    name: string;
    provider: string;
    providerId: string;
    isBeta?: boolean;
}
export interface LLMModelConfig {
    model?: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    maxTokens?: number;
}
export declare function getModelClient(model: LLMModel, config: LLMModelConfig): LanguageModel;
export declare function getDefaultModelParams(model: LLMModel): {
    temperature: number;
    maxTokens: number;
    topP: number;
};
