---
name: backend-dev
description: >
  Backend development rules for FlowBit V2 customer apps. Use for API routes,
  server actions, Prisma repositories, Better Auth, document processing, Azure
  storage, Outlook, DATEV/export, and customer-local business logic.
---

# Backend Dev Skill

## FlowBit V2 Rule

Keep backend behavior local to the customer app unless repeated customer demand proves it should move.

## Required Rules

- Work inside `apps/<customer>` unless the user approves a wider repo change.
- Do not add generic RBAC, workflow engine, billing engine, or cross-customer abstractions.
- Prefer local server modules under `apps/<customer>/modules/<domain>/server`.
- Keep API routes thin: auth/access check, parse/validate input, call server service, return response.
- Derive user/customer identity from session, never from client-provided IDs.
- Use existing Prisma repository/service patterns. Avoid raw SQL unless needed for stale client/schema compatibility or performance.
- Never log secrets, tokens, storage keys, credentials, or unnecessary PII.
- For user-facing errors from backend that render in UI, make sure UI copy comes from both customer locale files.
- Keep package versions exact. Do not add `^` or `~`.

## Customer Checks

After source changes, run:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```

For structural repo changes, also run:

```bash
pnpm validate
```

If `pnpm validate` is blocked by known repo validator drift, report the exact failure.
