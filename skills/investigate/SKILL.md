---
name: investigate
description: >
  Systematic debugging and root-cause investigation for FlowBit V2. Use when
  something is broken, confusing, intermittent, failing in prod/local, or the
  user asks why something happens.
---

# Investigate Skill

## Process

1. Define the observed symptom in one sentence.
2. Identify the exact customer app, route, component, API route, DB model, or integration involved.
3. Generate at least three plausible causes before editing.
4. Gather evidence with read-only commands first.
5. Confirm the root cause before changing code.
6. Make the smallest fix that addresses the confirmed cause.
7. Verify with the narrowest meaningful check, usually TypeScript plus a targeted runtime/manual check.

## FlowBit Checks

- For Customer A document/upload/extraction issues, inspect upload route, ingestion service, processing jobs, source events, document fields, and line items.
- For Prisma errors, compare `apps/<customer>/prisma/schema.prisma`, generated client state, and actual query/include usage.
- For UI state issues, inspect server page data, client props, local state, and API response shape together.
- For i18n issues, verify both customer `en.json` and `de.json`.

## Output

Report:

- root cause
- evidence
- fix made or proposed
- verification run
- remaining risk, if any
