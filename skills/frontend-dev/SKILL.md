---
name: frontend-dev
description: >
  Frontend implementation rules for FlowBit V2 customer apps. Use for React,
  Next.js App Router pages, forms, tables, modals, client state, browser-facing
  API calls, and customer UI behavior.
---

# Frontend Dev Skill

## Required Rules

- Keep UI implementation local to the customer app unless shared reuse is proven.
- Read existing page/component patterns before editing.
- Do not hardcode user-facing UI text.
- Add every new or changed UI string to both:
  - `apps/<customer>/modules/i18n/messages/en.json`
  - `apps/<customer>/modules/i18n/messages/de.json`
- Keep English and German JSON keys aligned.
- Pass dictionary text from server routes/pages into client components when needed.
- Use existing customer components from `apps/<customer>/components/ui` and local modules before adding new libraries.
- Use `lucide-react` icons already available in customer apps.
- Preserve loading, error, empty, disabled, success, and rapid-click states for browser-facing flows.
- Keep forms and tables dense, scannable, and consistent with FlowBit operations UI.

## Customer Checks

After source changes, run:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```

For browser-facing changes, verify manually or with an available browser tool when feasible.
