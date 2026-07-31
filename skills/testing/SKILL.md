---
name: testing
description: >
  Testing and verification rules for FlowBit V2 customer apps. Use whenever
  Codex changes behavior, fixes a bug, adds backend logic, touches document
  processing, Outlook, DATEV/export, master data, Prisma mapping, API routes,
  or browser-facing UI; use before handoff to decide what tests to add or run.
---

# Testing Skill

## Default Rule

Treat tests as part of the change, not as a separate nice-to-have. When a code
change alters behavior, add or update the smallest useful test that would catch
the bug or protect the new rule.

## Test Decision

- Add or update a test when changing parsing, mapping, validation, classification, extraction, export, duplicate handling, master-data linking, Outlook ingestion, auth/access, Prisma persistence, or shared formatting helpers.
- Add a regression test when fixing a bug that can be reproduced with pure data or a server helper.
- Prefer adjacent tests beside the changed module, following existing `*.test.ts` patterns.
- Do not add broad tests for pure visual spacing, copy-only changes, or tiny CSS-only changes unless the UI behavior can regress in a meaningful way.
- If a useful test is blocked by missing runner, environment, secrets, or heavy setup, say exactly why and run the best available check instead.

## Customer A Patterns

- Customer A tests commonly use Node's built-in test API:

```ts
import test from "node:test";
import assert from "node:assert/strict";
```

- Put server/domain tests near the code:
  - `apps/customer-a/modules/document-processing/server/*.test.ts`
  - `apps/customer-a/modules/documents/*.test.ts`
  - `apps/customer-a/modules/master-data/server/*.test.ts`
  - `apps/customer-a/modules/exports-datev/*.test.ts`
- Keep tests deterministic. Mock network/LLM/Azure/Graph boundaries or test local routing/normalization helpers.
- Do not require real Azure, Microsoft Graph, DATEV, Neon, or mailbox credentials in unit tests.
- For UI behavior that is mostly data transformation, extract or reuse pure helpers and test those helpers.

## Verification Commands

Always run the customer TypeScript check after Customer A source changes:

```bash
npx tsc -p apps/customer-a/tsconfig.json --noEmit --pretty false
```

Run structural validation after scaffold, package, routing, workspace, or skill changes:

```bash
pnpm validate
```

Run focused package tests when the changed package has a script, for example:

```bash
corepack pnpm --filter @flowbit-v2/e-invoice test
```

For Customer A operational scripts, run the narrow check matching the area when useful:

```bash
corepack pnpm --filter @flowbit-v2/customer-a auth:check
corepack pnpm --filter @flowbit-v2/customer-a outlook:check
corepack pnpm --filter @flowbit-v2/customer-a document-actions:check
```

Customer A currently has many `*.test.ts` files but no generic `test` script.
Do not claim all Customer A unit tests were executed unless a real runner was
added or used. TypeScript still checks those test files because they are included
by `apps/customer-a/tsconfig.json`.

## Browser-Facing Changes

- For React pages, forms, tables, modals, upload flows, filters, and review UI, verify loading, empty, disabled, success, error, and rapid-click states where feasible.
- Use the repo `expect` skill for adversarial browser verification when a dev server/browser check is appropriate.
- For text changes, verify new user-facing strings are in both:
  - `apps/customer-a/modules/i18n/messages/en.json`
  - `apps/customer-a/modules/i18n/messages/de.json`

## Handoff

Report:

- tests added or updated
- commands run and results
- important checks skipped and the exact reason
