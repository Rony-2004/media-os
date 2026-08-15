# Nothing UI and LinkedIn Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish every existing page with a responsive Nothing-inspired system and make LinkedIn likes and comments reflect real API results or an explicit unavailable state.

**Architecture:** A server-only LinkedIn client owns versioned API requests, canonical URNs, parsing, and error mapping. Thin routes call it and return typed sync state. Shared UI primitives and CSS tokens establish the design language, while existing pages migrate incrementally to preserve their behavior.

**Tech Stack:** Next.js 15, React 19, TypeScript strict mode, Tailwind CSS, TanStack Query, Prisma, Zod, Node test runner through `tsx`.

## Global Constraints

- Keep custom JWT authentication; do not add an auth framework.
- Keep API success responses shaped as `{ data: ... }` and failures as `{ error: { code, message, details? } }`.
- Use LinkedIn `/rest` APIs with `Linkedin-Version: 202607` and `X-Restli-Protocol-Version: 2.0.0`.
- Never present generated or fallback engagement as real LinkedIn data.
- Preserve existing staged and unstaged user changes; make no commits.
- Maintain strict TypeScript and avoid `any` in new code.

---

### Task 1: Typed LinkedIn engagement client

**Files:**
- Create: `apps/web/src/lib/linkedin/client.ts`
- Create: `apps/web/src/lib/linkedin/types.ts`
- Create: `apps/web/src/lib/linkedin/client.test.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: `canonicalizeLinkedInPostUrn(value: string): string | null`
- Produces: `fetchLinkedInSocialMetadata(accessToken: string, postUrn: string): Promise<LinkedInResult<EngagementMetrics>>`
- Produces: `fetchLinkedInComments(accessToken: string, postUrn: string): Promise<LinkedInResult<LinkedInComment[]>>`
- Produces: `createLinkedInComment(accessToken: string, postUrn: string, actorUrn: string, message: string): Promise<LinkedInResult<{ id: string }>>`

- [ ] **Step 1: Add the test command and failing parser tests**

```json
"test": "tsx --test src/**/*.test.ts"
```

```ts
test('keeps a canonical LinkedIn post URN', () => {
  assert.equal(canonicalizeLinkedInPostUrn('urn:li:ugcPost:123'), 'urn:li:ugcPost:123');
});

test('extracts the URN from a LinkedIn feed URL', () => {
  assert.equal(
    canonicalizeLinkedInPostUrn('https://www.linkedin.com/feed/update/urn:li:activity:123/'),
    'urn:li:activity:123',
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `corepack pnpm --filter @ai-social-os/web test`

Expected: FAIL because `canonicalizeLinkedInPostUrn` does not exist.

- [ ] **Step 3: Implement canonicalization, typed results, versioned headers, and response parsing**

```ts
export type LinkedInSyncStatus =
  | 'ok'
  | 'permission_required'
  | 'token_expired'
  | 'rate_limited'
  | 'upstream_error';

export type LinkedInResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: Exclude<LinkedInSyncStatus, 'ok'>; message: string; httpStatus?: number };
```

Every request must include the version and Rest.li headers, parse errors without leaking tokens, and interpret missing summaries in a successful social-metadata response as zero.

- [ ] **Step 4: Add failing tests for zero totals, reaction sums, comments, 401, 403, and 429**

Use injected `fetch` or a module-level request helper so tests assert returned values rather than mock call counts.

- [ ] **Step 5: Run tests until GREEN**

Run: `corepack pnpm --filter @ai-social-os/web test`

Expected: all LinkedIn client tests PASS.

### Task 2: Truthful posts and comments APIs

**Files:**
- Modify: `apps/web/src/app/api/posts/route.ts`
- Modify: `apps/web/src/app/api/comments/route.ts`
- Modify: `apps/web/src/app/api/social-accounts/linkedin/callback/route.ts`
- Modify: `apps/web/src/app/api/social-accounts/linkedin/auth/route.ts`

**Interfaces:**
- Consumes: LinkedIn client interfaces from Task 1.
- Produces: post `engagementSync: { status, message?, syncedAt? }`.
- Produces: comments response `{ comments, sync: { status, message? } }`.

- [ ] **Step 1: Write failing tests for route-facing pure mappers**

Cover platform filtering, preservation of cached metrics after a failed sync, successful real zero totals, and comment reply payload construction.

- [ ] **Step 2: Run tests and verify RED**

Run: `corepack pnpm --filter @ai-social-os/web test`

Expected: FAIL because the route mappers and sync status do not exist.

- [ ] **Step 3: Replace URN guessing and legacy `/v2` calls**

Use the stored `platformPostId` as the canonical source. Only persist metrics after an `ok` result. Include unavailable status when LinkedIn refuses access, and honor the `platform` query parameter.

- [ ] **Step 4: Remove AI generation from comment fetching and validate comment actions with Zod**

```ts
const commentActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('generate_reply'), commentText: z.string().min(1).max(3000) }),
  z.object({
    action: z.literal('post_reply'),
    postUrn: z.string().min(1),
    replyText: z.string().min(1).max(3000),
  }),
]);
```

Return failure when LinkedIn rejects the reply. Do not mark a reply sent on a failed upstream response.

- [ ] **Step 5: Persist the scopes returned by the OAuth token exchange**

Prefer `tokens.scope`; fall back to the exact requested scope list. Keep restricted read permission failures explicit because code cannot grant LinkedIn product access.

- [ ] **Step 6: Run tests and type-check**

Run: `corepack pnpm --filter @ai-social-os/web test`

Run: `corepack pnpm --filter @ai-social-os/web check-types`

Expected: PASS.

### Task 3: Nothing-inspired design system and responsive shell

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/components/ui/product.tsx`
- Create: `apps/web/src/components/brand/marks.tsx`
- Modify: `apps/web/src/components/dashboard/sidebar.tsx`
- Modify: `apps/web/src/components/dashboard/header.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Produces: `PageHeader`, `Panel`, `StatusBadge`, `InlineNotice`, `EmptyState`, `MetricCard`.
- Produces: `NothingMark`, `LinkedInMark`.

- [ ] **Step 1: Add semantic tokens and reusable component classes**

Use warm off-white/near-black surfaces, red signal color, dot-grid background, 1px borders, accessible focus rings, and reduced-motion support.

- [ ] **Step 2: Build shared primitives with typed props**

Each component must accept `className`, preserve semantic HTML, and avoid page-specific business logic.

- [ ] **Step 3: Rebuild the dashboard shell for desktop and mobile**

Use an accessible menu button, overlay, `aria-expanded`, and route-change closing. Keep all existing navigation and role checks.

- [ ] **Step 4: Type-check**

Run: `corepack pnpm --filter @ai-social-os/web check-types`

Expected: PASS.

### Task 4: Auth and core dashboard page polish

**Files:**
- Modify: `apps/web/src/app/(auth)/layout.tsx`
- Modify: `apps/web/src/app/(auth)/login/page.tsx`
- Modify: `apps/web/src/app/(auth)/register/page.tsx`
- Modify: `apps/web/src/app/(auth)/verify-email/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/accounts/page.tsx`

**Interfaces:**
- Consumes: Task 3 primitives and brand marks.

- [ ] **Step 1: Apply the new auth composition**

Use a branded editorial panel on desktop, a compact form surface, clear validation/error states, and a single-column mobile layout.

- [ ] **Step 2: Recompose dashboard metrics, quick actions, account connection, and onboarding states**

Keep existing queries and mutations. Replace gradients/glass cards with shared panels and truthful status labels.

- [ ] **Step 3: Verify keyboard focus and responsive overflow**

Check 390px, 768px, 1280px, and 1536px widths.

### Task 5: Workspace and remaining page polish

**Files:**
- Modify: `apps/web/src/app/(dashboard)/platform/[provider]/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/posts/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/posts/new/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/ai-settings/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/quota/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/settings/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/admin/page.tsx`

**Interfaces:**
- Consumes: Tasks 2 and 3 response types/primitives.

- [ ] **Step 1: Type the workspace post metadata and comment response**

Remove new `any` usage. Render `0` only for `engagementSync.status === 'ok'`; render `—` plus an inline explanation otherwise.

- [ ] **Step 2: Polish workspace tabs and cards without changing workflows**

Preserve suggestion approval, draft scheduling, publish, AI generation, and comment reply behavior. Make tabs horizontally scrollable on small screens and all action rows wrap safely.

- [ ] **Step 3: Update comment reply behavior**

Send `postUrn` and real `commentText` where required, show mutation errors, and invalidate comments/posts only after confirmed success.

- [ ] **Step 4: Apply the same visual hierarchy to posts, editor, AI settings, quota, settings, and admin**

Use shared headers, panels, notices, metrics, inputs, and empty states; preserve every current form and mutation.

- [ ] **Step 5: Type-check**

Run: `corepack pnpm --filter @ai-social-os/web check-types`

Expected: PASS.

### Task 6: Full verification

**Files:**
- Modify only files required by verified failures.

**Interfaces:**
- Consumes: all previous tasks.

- [ ] **Step 1: Run unit tests**

Run: `corepack pnpm --filter @ai-social-os/web test`

Expected: PASS with no warnings.

- [ ] **Step 2: Run strict type-check and production build**

Run: `corepack pnpm --filter @ai-social-os/web check-types`

Run: `corepack pnpm --filter @ai-social-os/web build`

Expected: PASS.

- [ ] **Step 3: Verify the running app in a browser**

Check auth, dashboard, accounts, LinkedIn published/comments tabs, AI settings, quota, settings, and admin at desktop and mobile widths. Confirm there is no horizontal overflow, fabricated engagement, or false success state.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; pre-existing staged/unstaged ownership is preserved and all new work is clearly identified.
