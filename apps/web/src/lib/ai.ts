/**
 * AI Provider — supports Google Gemini API & Anthropic.
 * Primary model: gemini-3.6-flash
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getModel(): string {
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

/**
 * Call the configured AI providers and return their text response.
 */
export async function callAI(options: AICallOptions): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // 1. Use OpenRouter as the primary provider when configured.
  if (hasUsableKey(openRouterKey)) {
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'ConnectUs',
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

  // 2. Try Gemini API if GEMINI_API_KEY is provided.
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

  // 3. Try Anthropic if ANTHROPIC_API_KEY is available
  if (anthropicKey && !anthropicKey.includes('your-key')) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: options.maxTokens ?? 1024,
          messages: options.messages,
          system: options.system,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e: any) {
      console.warn('[Anthropic Warning]:', e.message);
    }
  }

  throw new Error('AI service is unavailable. Check the configured provider and try again.');
}
