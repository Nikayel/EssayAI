import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Dynamic AI Provider Configuration
 * Supports: Anthropic, OpenAI, DeepSeek, Gemini
 */

export type AIProvider = 'anthropic' | 'openai' | 'deepseek' | 'gemini';
export type ModelTier = 'fast' | 'balanced' | 'quality';

export interface AIModel {
  provider: AIProvider;
  modelId: string;
  maxTokens: number;
  costPer1MTokens: number; // in USD
  tier: ModelTier;
}

/**
 * Available models across providers
 */
export const AI_MODELS: Record<string, AIModel> = {
  // Anthropic Claude
  'claude-haiku': {
    provider: 'anthropic',
    modelId: 'claude-3-haiku-20240307',
    maxTokens: 4096,
    costPer1MTokens: 0.25,
    tier: 'fast',
  },
  'claude-sonnet': {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    costPer1MTokens: 3.0,
    tier: 'balanced',
  },
  'claude-opus': {
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    maxTokens: 4096,
    costPer1MTokens: 15.0,
    tier: 'quality',
  },

  // OpenAI
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    maxTokens: 16384,
    costPer1MTokens: 0.15,
    tier: 'fast',
  },
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    maxTokens: 16384,
    costPer1MTokens: 2.5,
    tier: 'balanced',
  },
  'gpt-4-turbo': {
    provider: 'openai',
    modelId: 'gpt-4-turbo-preview',
    maxTokens: 128000,
    costPer1MTokens: 10.0,
    tier: 'quality',
  },

  // DeepSeek
  'deepseek-chat': {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    maxTokens: 4096,
    costPer1MTokens: 0.14,
    tier: 'fast',
  },
  'deepseek-coder': {
    provider: 'deepseek',
    modelId: 'deepseek-coder',
    maxTokens: 16384,
    costPer1MTokens: 0.14,
    tier: 'balanced',
  },

  // Google Gemini
  'gemini-flash': {
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    maxTokens: 8192,
    costPer1MTokens: 0.075,
    tier: 'fast',
  },
  'gemini-pro': {
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    maxTokens: 32768,
    costPer1MTokens: 1.25,
    tier: 'balanced',
  },
};

/**
 * Initialize AI clients
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com/v1',
});

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get default models by tier
 */
export function getDefaultModel(tier: ModelTier): string {
  // Prefer cheaper models with good quality
  const tierMap: Record<ModelTier, string> = {
    fast: 'gemini-flash', // Cheapest & fastest
    balanced: 'deepseek-chat', // Best value
    quality: 'claude-sonnet', // Best quality
  };

  return tierMap[tier];
}

/**
 * Universal AI completion function
 */
export async function generateCompletion(params: {
  modelKey: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const model = AI_MODELS[params.modelKey];
  if (!model) {
    throw new Error(`Unknown model: ${params.modelKey}`);
  }

  const temperature = params.temperature ?? 0.3;
  const maxTokens = params.maxTokens ?? model.maxTokens;

  switch (model.provider) {
    case 'anthropic':
      return await generateAnthropicCompletion(model, params.systemPrompt, params.userPrompt, temperature, maxTokens);

    case 'openai':
      return await generateOpenAICompletion(model, params.systemPrompt, params.userPrompt, temperature, maxTokens);

    case 'deepseek':
      return await generateDeepSeekCompletion(model, params.systemPrompt, params.userPrompt, temperature, maxTokens);

    case 'gemini':
      return await generateGeminiCompletion(model, params.systemPrompt, params.userPrompt, temperature, maxTokens);

    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}

/**
 * Anthropic completion
 */
async function generateAnthropicCompletion(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await anthropic.messages.create({
    model: model.modelId,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  return content.text;
}

/**
 * OpenAI completion
 */
async function generateOpenAICompletion(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: model.modelId,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return response.choices[0].message.content || '';
}

/**
 * DeepSeek completion (OpenAI-compatible)
 */
async function generateDeepSeekCompletion(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: model.modelId,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return response.choices[0].message.content || '';
}

/**
 * Google Gemini completion
 */
async function generateGeminiCompletion(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const geminiModel = gemini.getGenerativeModel({
    model: model.modelId,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await geminiModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt + '\n\n' + userPrompt },
        ],
      },
    ],
  });

  const response = await result.response;
  return response.text();
}

/**
 * Generate embeddings (OpenAI only for now)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get model cost estimate
 */
export function estimateCost(modelKey: string, inputTokens: number, outputTokens: number): number {
  const model = AI_MODELS[modelKey];
  if (!model) return 0;

  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1_000_000) * model.costPer1MTokens;
}

export { anthropic, openai, deepseek, gemini };
