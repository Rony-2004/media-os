---
name: shadcn
description: >
  shadcn/ui usage guidance for FlowBit V2 customer apps. Use when composing
  buttons, dialogs, dropdowns, tables, forms, inputs, badges, sidebars, tooltips,
  or adding new UI primitives.
---

# shadcn Skill

## Local Component Rule

Use components already present in the customer app first:

```text
apps/<customer>/components/ui
```

Customer A currently includes primitives such as `button`, `card`, `checkbox`, `dropdown-menu`, `input`, `label`, `sheet`, `sidebar`, `skeleton`, `table`, `textarea`, and `tooltip`.

## Composition Rules

- Use the local `Button` component for actions.
- Use `lucide-react` icons inside buttons where helpful.
- Keep icon-only buttons accessible with `aria-label`.
- Keep dialog/modal actions in a stable footer.
- Prefer existing variants before adding custom classes.
- Keep tables dense and scannable; avoid decorative card-heavy table rows.
- Avoid hardcoded text; put UI strings in customer `en.json` and `de.json`.
- Do not add a shadcn component dependency or CLI-generated component unless existing local primitives cannot handle the UI.
- If adding a new primitive, keep it local to the customer unless multiple apps need it.

## Verification

After source changes:

```bash
npx tsc -p apps/<customer>/tsconfig.json --noEmit --pretty false
```
