---
name: ship
description: >
  Pre-ship checklist for FlowBit V2 changes. Use before final handoff, PR
  description, commit, or when the user asks if a change is ready.
---

# Ship Skill

## Checklist

- Confirm newest user request is satisfied.
- Check `git status --short` and distinguish current task changes from unrelated dirty files.
- For customer source changes, run:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```

- For structural changes, run `pnpm validate` when feasible and report exact blockers.
- For UI text changes, confirm both customer `en.json` and `de.json` were updated.
- For backend changes, confirm auth/session assumptions and error handling.
- For browser-facing changes, verify loading, error, empty, disabled, and success states where feasible.
- For DB changes, confirm schema/client/migration or `db push` needs are handled or clearly reported.

## Final Response

Keep final concise:

- what changed
- files touched, when useful
- checks run and result
- known blockers or risks
