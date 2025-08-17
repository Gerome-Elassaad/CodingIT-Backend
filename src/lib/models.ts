import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { mistral } from '@ai-sdk/mistral'
import { LanguageModel } from 'ai'

export interface LLMModel {
  id: string
  name: string
  provider: string
  providerId: string
  isBeta?: boolean
}

export interface LLMModelConfig {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModelClient(model: LLMModel, config: LLMModelConfig): LanguageModel {
  const { apiKey, baseURL, ...params } = config

  switch (model.provider) {
    case 'openai':
      return openai(model.providerId, {
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        baseURL: baseURL
      })
    
    case 'anthropic':
      return anthropic(model.providerId, {
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY
      })
    
    case 'google':
      return google(model.providerId, {
        apiKey: apiKey || process.env.GOOGLE_AI_API_KEY
      })
    
    case 'mistral':
      return mistral(model.providerId, {
        apiKey: apiKey || process.env.MISTRAL_API_KEY
      })
    
    default:
      throw new Error(`Unsupported model provider: ${model.provider}`)
  }
}

export function getDefaultModelParams(model: LLMModel) {
  return {
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9
  }
}