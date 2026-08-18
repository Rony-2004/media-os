import assert from 'node:assert/strict';
import test from 'node:test';
import { callAI, getModel } from './ai';
import * as aiModule from './ai';

test('strict Claude calls never fall back to another provider', async () => {
  const callClaude = (
    aiModule as unknown as {
      callClaude?: typeof callAI;
    }
  ).callClaude;

  assert.equal(typeof callClaude, 'function', 'a strict Claude-only call path must exist');

  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalAnthropicModel = process.env.ANTHROPIC_MODEL;
  const originalAnthropicEffort = process.env.ANTHROPIC_REASONING_EFFORT;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;

  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.ANTHROPIC_MODEL = 'claude-sonnet-test';
  process.env.ANTHROPIC_REASONING_EFFORT = 'low';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

  const requestUrls: string[] = [];
  console.warn = () => {};
  globalThis.fetch = (async (input) => {
    requestUrls.push(String(input));
    return new Response(JSON.stringify({ error: { message: 'Anthropic unavailable' } }), {
      status: 503,
    });
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        callClaude!({
          messages: [{ role: 'user', content: 'Design a visual.' }],
          maxTokens: 300,
        }),
      /Anthropic unavailable/i,
    );
    assert.deepEqual(requestUrls, ['https://api.anthropic.com/v1/messages']);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
    restoreEnv('ANTHROPIC_MODEL', originalAnthropicModel);
    restoreEnv('ANTHROPIC_REASONING_EFFORT', originalAnthropicEffort);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
  }
});

test('uses Anthropic Claude as the primary AI provider when its key is configured', async () => {
  const originalFetch = globalThis.fetch;
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterModel = process.env.OPENROUTER_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalAnthropicModel = process.env.ANTHROPIC_MODEL;
  const originalAnthropicEffort = process.env.ANTHROPIC_REASONING_EFFORT;

  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.OPENROUTER_MODEL = 'openrouter/auto';
  delete process.env.GEMINI_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.ANTHROPIC_MODEL = 'claude-sonnet-test';
  process.env.ANTHROPIC_REASONING_EFFORT = 'low';

  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        content: [{ type: 'text', text: '  Claude response  ' }],
        model: 'claude-sonnet-test',
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    const result = await callAI({
      system: 'You are a social content agent.',
      messages: [{ role: 'user', content: 'Draft a post.' }],
      maxTokens: 250,
    });

    assert.equal(result, 'Claude response');
    assert.equal(getModel(), 'claude-sonnet-test');
    assert.equal(requestUrl, 'https://api.anthropic.com/v1/messages');
    assert.deepEqual(requestInit?.headers, {
      'Content-Type': 'application/json',
      'x-api-key': 'test-anthropic-key',
      'anthropic-version': '2023-06-01',
    });
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      model: 'claude-sonnet-test',
      max_tokens: 250,
      messages: [{ role: 'user', content: 'Draft a post.' }],
      system: 'You are a social content agent.',
      output_config: { effort: 'low' },
    });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv('AZURE_OPENAI_ENDPOINT', originalAzureEndpoint);
    restoreEnv('AZURE_OPENAI_API_KEY', originalAzureApiKey);
    restoreEnv('AZURE_OPENAI_DEPLOYMENT', originalAzureDeployment);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
    restoreEnv('OPENROUTER_MODEL', originalOpenRouterModel);
    restoreEnv('GEMINI_API_KEY', originalGeminiKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
    restoreEnv('ANTHROPIC_MODEL', originalAnthropicModel);
    restoreEnv('ANTHROPIC_REASONING_EFFORT', originalAnthropicEffort);
  }
});

test('uses the default Anthropic model when no model override is configured', () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalAnthropicModel = process.env.ANTHROPIC_MODEL;

  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  delete process.env.ANTHROPIC_MODEL;

  try {
    assert.equal(getModel(), 'claude-sonnet-5');
  } finally {
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
    restoreEnv('ANTHROPIC_MODEL', originalAnthropicModel);
  }
});

test('falls back to OpenRouter when the primary Anthropic request fails', async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterModel = process.env.OPENROUTER_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalAnthropicModel = process.env.ANTHROPIC_MODEL;

  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.ANTHROPIC_MODEL = 'claude-sonnet-test';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.OPENROUTER_MODEL = 'openrouter/auto';
  delete process.env.GEMINI_API_KEY;

  const requestUrls: string[] = [];
  console.warn = () => {};
  globalThis.fetch = (async (input) => {
    const url = String(input);
    requestUrls.push(url);

    if (url === 'https://api.anthropic.com/v1/messages') {
      return new Response(
        JSON.stringify({ error: { message: 'Anthropic unavailable' } }),
        { status: 503 },
      );
    }

    return new Response(
      JSON.stringify({ choices: [{ message: { content: '  OpenRouter fallback  ' } }] }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    const result = await callAI({
      messages: [{ role: 'user', content: 'Draft a post.' }],
      maxTokens: 250,
    });

    assert.equal(result, 'OpenRouter fallback');
    assert.deepEqual(requestUrls, [
      'https://api.anthropic.com/v1/messages',
      'https://openrouter.ai/api/v1/chat/completions',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    restoreEnv('AZURE_OPENAI_ENDPOINT', originalAzureEndpoint);
    restoreEnv('AZURE_OPENAI_API_KEY', originalAzureApiKey);
    restoreEnv('AZURE_OPENAI_DEPLOYMENT', originalAzureDeployment);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
    restoreEnv('OPENROUTER_MODEL', originalOpenRouterModel);
    restoreEnv('GEMINI_API_KEY', originalGeminiKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
    restoreEnv('ANTHROPIC_MODEL', originalAnthropicModel);
  }
});

test('uses OpenRouter as the primary AI provider when its key is configured', async () => {
  const originalFetch = globalThis.fetch;
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalAzureApiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterModel = process.env.OPENROUTER_MODEL;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  delete process.env.AZURE_OPENAI_API_VERSION;
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.OPENROUTER_MODEL = 'openrouter/auto';
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: 'assistant', content: '  OpenRouter response  ' } }],
        model: 'openai/gpt-5.1',
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    const result = await callAI({
      system: 'You are a social content agent.',
      messages: [{ role: 'user', content: 'Draft a post.' }],
      maxTokens: 250,
      temperature: 0.4,
    });

    assert.equal(result, 'OpenRouter response');
    assert.equal(requestUrl, 'https://openrouter.ai/api/v1/chat/completions');
    assert.deepEqual(requestInit?.headers, {
      Authorization: 'Bearer test-openrouter-key',
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SocialFlow',
    });
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: 'You are a social content agent.' },
        { role: 'user', content: 'Draft a post.' },
      ],
      max_tokens: 250,
      temperature: 0.4,
    });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv('AZURE_OPENAI_ENDPOINT', originalAzureEndpoint);
    restoreEnv('AZURE_OPENAI_API_KEY', originalAzureApiKey);
    restoreEnv('AZURE_OPENAI_DEPLOYMENT', originalAzureDeployment);
    restoreEnv('AZURE_OPENAI_API_VERSION', originalAzureApiVersion);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
    restoreEnv('OPENROUTER_MODEL', originalOpenRouterModel);
    restoreEnv('GEMINI_API_KEY', originalGeminiKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
  }
});

test('uses Azure OpenAI as primary provider when configured', async () => {
  const originalFetch = globalThis.fetch;
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalAzureApiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  process.env.AZURE_OPENAI_ENDPOINT = 'https://example-resource.openai.azure.com/';
  process.env.AZURE_OPENAI_API_KEY = 'test-azure-key';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4o-mini';
  process.env.AZURE_OPENAI_API_VERSION = '2024-02-15-preview';
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: 'assistant', content: '  Azure response  ' } }],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    const result = await callAI({
      system: 'You are a social content agent.',
      messages: [{ role: 'user', content: 'Draft a post.' }],
      maxTokens: 220,
      temperature: 0.5,
    });

    assert.equal(result, 'Azure response');
    assert.equal(
      requestUrl,
      'https://example-resource.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview',
    );
    assert.deepEqual(requestInit?.headers, {
      'Content-Type': 'application/json',
      'api-key': 'test-azure-key',
    });
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      messages: [
        { role: 'system', content: 'You are a social content agent.' },
        { role: 'user', content: 'Draft a post.' },
      ],
      max_tokens: 220,
      temperature: 0.5,
    });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv('AZURE_OPENAI_ENDPOINT', originalAzureEndpoint);
    restoreEnv('AZURE_OPENAI_API_KEY', originalAzureApiKey);
    restoreEnv('AZURE_OPENAI_DEPLOYMENT', originalAzureDeployment);
    restoreEnv('AZURE_OPENAI_API_VERSION', originalAzureApiVersion);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
    restoreEnv('GEMINI_API_KEY', originalGeminiKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
  }
});

test('throws when every AI provider is unavailable instead of returning fabricated content', async () => {
  const originalAzureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalAzureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalAzureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const originalAzureApiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  delete process.env.AZURE_OPENAI_API_VERSION;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    await assert.rejects(
      () =>
        callAI({
          messages: [{ role: 'user', content: 'Write a post about database indexing.' }],
        }),
      /AI service is unavailable/,
    );
  } finally {
    restoreEnv('AZURE_OPENAI_ENDPOINT', originalAzureEndpoint);
    restoreEnv('AZURE_OPENAI_API_KEY', originalAzureApiKey);
    restoreEnv('AZURE_OPENAI_DEPLOYMENT', originalAzureDeployment);
    restoreEnv('AZURE_OPENAI_API_VERSION', originalAzureApiVersion);
    restoreEnv('OPENROUTER_API_KEY', originalOpenRouterKey);
    restoreEnv('GEMINI_API_KEY', originalGeminiKey);
    restoreEnv('ANTHROPIC_API_KEY', originalAnthropicKey);
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
