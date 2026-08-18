/**
 * AI Provider — supports Anthropic, Azure OpenAI, OpenRouter, and Gemini.
 * Primary model: Claude Sonnet 5 when Anthropic is configured.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_AZURE_OPENAI_API_VERSION = '2024-02-15-preview';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';
const ANTHROPIC_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

type AnthropicEffort = (typeof ANTHROPIC_EFFORTS)[number];

function getAnthropicEffort(): AnthropicEffort | null {
  const configured = process.env.ANTHROPIC_REASONING_EFFORT?.trim().toLowerCase();
  return ANTHROPIC_EFFORTS.find((effort) => effort === configured) ?? null;
}

export function getModel(): string {
  if (hasUsableKey(process.env.ANTHROPIC_API_KEY)) {
    return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  }

  if (hasUsableKey(process.env.OPENROUTER_API_KEY)) {
    return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  }

  const model = process.env.AI_MODEL;
  if (!model || model === 'gemini-2.5-flash' || !model.startsWith('gemini')) {
    return 'gemini-3.6-flash';
  }
  return model;
}

function getGeminiModel(): string {
  const model = process.env.AI_MODEL;
  if (!model || model === 'gemini-2.5-flash' || !model.startsWith('gemini')) {
    return 'gemini-3.6-flash';
  }
  return model;
}

function hasUsableKey(key: string | undefined): key is string {
  return Boolean(key && !key.includes('your-key'));
}

function normalizeAzureEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICallOptions {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

async function requestClaude(
  options: AICallOptions,
  apiKey: string,
  model: string,
): Promise<string> {
  const effort = getAnthropicEffort();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 1024,
      messages: options.messages,
      system: options.system,
      ...(effort ? { output_config: { effort } } : {}),
    }),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(errorBody?.error?.message || `Anthropic API error (${res.status})`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (!text?.trim()) throw new Error('Anthropic returned an empty response.');
  return text.trim();
}

/**
 * Calls Anthropic directly and never falls back to another provider.
 * Image-design generation uses this path so its AI provenance is always Claude.
 */
export async function callClaude(options: AICallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!hasUsableKey(apiKey)) {
    throw new Error('ANTHROPIC_API_KEY is required for Claude image generation.');
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  return requestClaude(options, apiKey, model);
}

/**
 * Call the configured AI providers and return their text response.
 */
export async function callAI(options: AICallOptions): Promise<string> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || DEFAULT_AZURE_OPENAI_API_VERSION;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropicModel = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;

  // 1. Use Anthropic Claude as the primary provider when configured.
  if (hasUsableKey(anthropicKey)) {
    try {
      return await requestClaude(options, anthropicKey, anthropicModel);
    } catch (error: unknown) {
      console.warn('[Anthropic Warning]:', error instanceof Error ? error.message : 'Request failed');
    }
  }

  // 2. Use Azure OpenAI when configured.
  if (
    hasUsableKey(azureApiKey) &&
    hasUsableKey(azureEndpoint) &&
    hasUsableKey(azureDeployment)
  ) {
    try {
      const url = `${normalizeAzureEndpoint(azureEndpoint)}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey,
        },
        body: JSON.stringify({
          messages: [
            ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
            ...options.messages,
          ],
          max_tokens: options.maxTokens ?? 1024,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        const errorBody = (await res.json().catch(() => null)) as
          | {
              error?: { message?: string };
            }
          | null;
        console.warn(`[Azure OpenAI API ${res.status}]: ${errorBody?.error?.message || res.statusText}`);
      }
    } catch (error: unknown) {
      console.warn('[Azure OpenAI Warning]:', error instanceof Error ? error.message : 'Request failed');
    }
  }

  // 3. Use OpenRouter when configured.
  if (hasUsableKey(openRouterKey)) {
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'SocialFlow',
        },
        body: JSON.stringify({
          model: getModel(),
          messages: [
            ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
            ...options.messages,
          ],
          max_tokens: options.maxTokens ?? 1024,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        const errorBody = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        console.warn(`[OpenRouter API ${res.status}]: ${errorBody?.error?.message || res.statusText}`);
      }
    } catch (error: unknown) {
      console.warn('[OpenRouter Warning]:', error instanceof Error ? error.message : 'Request failed');
    }
  }

  // 4. Try Gemini API if GEMINI_API_KEY is provided.
  if (geminiKey && !geminiKey.includes('your-key')) {
    try {
      const model = getGeminiModel();
      const url = `${GEMINI_API_URL}/${model}:generateContent?key=${geminiKey}`;

      const contents = options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body: Record<string, any> = { contents };
      if (options.system) {
        body.systemInstruction = { parts: [{ text: options.system }] };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`[Gemini API ${res.status}]:`, err?.error?.message || res.statusText);
      }
    } catch (e: any) {
      console.warn('[Gemini Call Warning]:', e.message);
    }
  }

  throw new Error('AI service is unavailable. Check the configured provider and try again.');
}
