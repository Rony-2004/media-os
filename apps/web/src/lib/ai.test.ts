import assert from 'node:assert/strict';
import test from 'node:test';
import { callAI } from './ai';

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
      'X-Title': 'ConnectUs',
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
