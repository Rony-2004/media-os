---
name: frontend-design
description: >
  Product UI design guidance for FlowBit V2 customer apps. Use when changing
  layouts, visual hierarchy, interaction design, modals, tables, dashboards,
  forms, review screens, or design polish.
---

# Frontend Design Skill

## Design Direction

FlowBit customer apps are operational tools. They should feel quiet, precise, dense, and repeat-use friendly.

## Required Rules

- Build the usable workflow as the first screen, not a marketing page.
- Prefer table, toolbar, tabs, segmented controls, selects, checkboxes, and compact panels for operational work.
- Keep cards for repeated items, dialogs, and genuinely framed tools. Do not nest cards inside cards.
- Use clear visual hierarchy: page title, toolbar, tabs/filter row, dense content area, stable footer/action area.
- Use icons in buttons when the action benefits from quick scanning.
- Keep text sizes proportional to the surface. Avoid hero-scale text inside dashboards, sidebars, panels, or tables.
- Make button and control dimensions stable so labels/loading states do not shift layout.
- Ensure mobile and desktop text does not overflow or overlap.
- Avoid one-note palettes and decorative blobs/orbs. Use FlowBit tokens and existing component styles.
- When porting from `../flow-bit-ai`, copy visual behavior and affordances, not backend hooks or architecture.

## i18n + Validation

- No hardcoded user-facing UI text. Update both `en.json` and `de.json` for the customer.
- After source changes, run that customer app's TypeScript check.
