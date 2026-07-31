---
name: neon-postgres
description: >
  Neon Postgres and Prisma guidance for FlowBit V2 customer apps. Use for
  schema changes, migrations, Prisma Client errors, indexes, query performance,
  and database-backed customer features.
---

# Neon Postgres Skill

## FlowBit V2 Database Model

- Each customer app owns its own database/project.
- Keep schema and persistence decisions inside the customer app.
- Do not introduce shared cross-customer data models unless explicitly approved.

## Prisma Rules

- Read `apps/<customer>/prisma/schema.prisma` before editing DB-backed code.
- Use existing repository/store modules before adding new DB access points.
- Prefer Prisma queries for normal CRUD.
- Use raw SQL only when needed for performance, schema/client drift, or a specific Postgres capability.
- Add indexes for new frequent filters, joins, or uniqueness assumptions.
- Keep migrations/schema sync explicit. Do not silently rely on generated state.
- Never run destructive DB commands without explicit user approval.
- Never expose DB URLs, credentials, or secrets in output.

## Verification

After source changes:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```

When schema changes need DB sync, report the exact Prisma command needed or run it only when appropriate for the environment.
