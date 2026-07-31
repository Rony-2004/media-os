---
name: customer-ui
description: >
  Customer app UI implementation rules. Use when changing any customer app page,
  component, form, button, modal, label, validation text, toast, or other
  browser-facing UI.
---

# Customer UI Skill

## Scope

Use for UI work inside any customer app:

- `apps/customer-a`
- `apps/customer-b`
- `apps/customer-c`
- `apps/customer-d`

## Required Rules

- Do not hardcode user-facing UI text in components.
- Put every new or changed customer UI string in both locale files for that customer:
  - `apps/<customer>/modules/i18n/messages/en.json`
  - `apps/<customer>/modules/i18n/messages/de.json`
- Keep English and German JSON keys aligned.
- Pass dictionary text from server route/page into client components when needed.
- After customer source code changes, run that customer app's TypeScript check from repo root:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```

## Notes

- This applies to button labels, modal copy, placeholders, toasts, status text,
  aria labels, empty states, validation text, and error text that users see.
- For docs-only changes, TypeScript is not required unless source files changed.
