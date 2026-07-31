---
name: refactoring
description: >
  Safe refactoring guidance for FlowBit V2. Use when improving structure,
  reducing duplication, moving code, extracting helpers, or simplifying a module.
---

# Refactoring Skill

## Rules

- Keep refactors narrow and tied to the user's request.
- Do not refactor adjacent code just because it is nearby.
- Preserve customer boundaries. One customer need stays local.
- Extract shared package code only after repeated customer need is proven.
- Avoid dependency-tree copying from `../flow-bit-ai`; copy behavior and visual affordances only.
- Keep public API and data shape stable unless the user asked for a contract change.
- Before changing a function, read its callers, callees, and persisted data shape.
- Do not mix formatting churn with behavior changes.
- Do not revert user or unrelated changes in a dirty worktree.

## Verification

- Run the changed customer's TypeScript check after source changes.
- Run `pnpm validate` after structural changes when feasible.
- Summarize behavior preserved and behavior changed.
