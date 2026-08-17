# Claude-Primary Content Generation Design

## Goal

Use Anthropic Claude as the primary provider for all AI-generated social content when `ANTHROPIC_API_KEY` is configured, while preserving the existing providers as automatic fallbacks.

## Current Context

All current AI generation routes call `callAI` from `apps/web/src/lib/ai.ts`. Anthropic support already exists there, but it runs only after Azure OpenAI, OpenRouter, and Gemini, and it uses a hard-coded deprecated Claude model. The existing provider tests use Node's built-in test runner and replace `globalThis.fetch` to inspect provider requests.

## Proposed Design

### Provider selection

`callAI` will attempt Anthropic first whenever `ANTHROPIC_API_KEY` is usable. The model will be read from `ANTHROPIC_MODEL`, with `claude-sonnet-5` as the default. `getModel()` will report the configured Anthropic model when Claude is active so API consumers see the provider model actually selected.

If Anthropic is not configured or its request fails, the existing provider order remains available: Azure OpenAI, OpenRouter, and Gemini. If every configured provider fails or no provider is configured, `callAI` will continue throwing the existing unavailable-service error.

### Anthropic request and response

The integration will continue using the Anthropic Messages API over `fetch`, with:

- `POST https://api.anthropic.com/v1/messages`
- `x-api-key` from `ANTHROPIC_API_KEY`
- `anthropic-version: 2023-06-01`
- `model` from `ANTHROPIC_MODEL` or the default
- `max_tokens`, `messages`, and optional `system` mapped from `AICallOptions`

The first text block in a successful response will be trimmed and returned. Non-success responses will be logged with the status and provider error message, without logging credentials or request content, then the next provider will be attempted.

### Configuration

No secret will be added to the repository. The developer will provide:

```env
ANTHROPIC_API_KEY=your-key-here
ANTHROPIC_MODEL=claude-sonnet-5
```

`ANTHROPIC_API_KEY` is already included in the Turbo environment allowlist. `ANTHROPIC_MODEL` will be added there so the optional model override reaches the Next.js app in development and builds.

### Testing

The provider test suite will cover:

1. Claude is selected before other providers when its key is configured.
2. The Anthropic URL, headers, model, system prompt, messages, and token limit are serialized correctly.
3. `getModel()` reports the configured Claude model and its default.
4. An Anthropic failure falls through to an existing provider.
5. The existing no-provider error behavior remains unchanged.

Tests will use fake `fetch` responses and test keys only; no real API call or secret will be used.

## Files

- Modify `apps/web/src/lib/ai.ts` to make Claude primary, add model configuration, and handle Anthropic errors consistently.
- Modify `apps/web/src/lib/ai.test.ts` with Claude-primary, model-selection, request-shape, and fallback coverage.
- Modify `turbo.json` to allow `ANTHROPIC_MODEL` in the task environment.
- No `.env` secret changes will be committed.

## Error handling and security

Provider credentials remain server-side environment variables. The browser receives only generated content or the existing generic API error response. Logs may include provider name, HTTP status, and sanitized provider error text, but never API keys, authorization headers, or full prompts.

## Scope boundaries

This change does not add an Anthropic SDK, change the AI route contracts, redesign prompts, remove other providers, or introduce per-user provider configuration. It changes provider priority and model configuration at the existing shared boundary only.
