# Nothing-Inspired UI and LinkedIn Engagement Design

## Goal

Turn AI Social OS into a cohesive, responsive product with a restrained Nothing-inspired visual language while making published-post reactions and comments reflect LinkedIn data truthfully.

## Chosen approach

Three approaches were considered:

1. **Token-only reskin:** fastest, but it would leave inconsistent page structure, oversized components, weak mobile behavior, and the 1,049-line platform page untouched.
2. **Full component rewrite:** cleanest in isolation, but too risky for the current feature-rich, uncommitted codebase.
3. **System-first progressive polish (chosen):** introduce shared design primitives and a typed LinkedIn client, then migrate the existing shell and pages without changing product behavior outside the requested engagement fixes.

The chosen approach provides a visible whole-product improvement while preserving existing business flows and user-owned changes.

## Visual direction

The design uses a monochrome base with a single red signal color, off-white and near-black surfaces, fine borders, dot-matrix texture, compact uppercase labels, and intentional square/rounded geometry. It is inspired by Nothing's industrial clarity without copying branded assets.

- Light mode is warm white with black typography; dark mode is near-black with soft white typography.
- Red is reserved for primary actions, live indicators, focus, and destructive states.
- Cards use low elevation, crisp borders, and subtle dot or grid texture instead of blue gradients and glassmorphism.
- Page titles are larger and simpler; supporting text is shorter and more legible.
- Controls have visible hover, focus, disabled, loading, success, and error states.
- Motion is brief and functional, and `prefers-reduced-motion` is respected.

## Shared UI architecture

Create small shared primitives for the dashboard rather than duplicating Tailwind strings:

- `PageHeader` for title, eyebrow, description, and page actions.
- `Panel` for bordered surfaces and optional section headers.
- `StatusBadge` for connected, published, draft, warning, and error states.
- `EmptyState`, `LoadingState`, and `InlineNotice` for consistent feedback.
- `MetricCard` for engagement and quota metrics.
- `NothingMark` and `LinkedInMark` for consistent brand rendering.

The dashboard shell becomes responsive: a fixed desktop sidebar, a compact mobile header, and a mobile navigation drawer. The main content width and spacing adapt from phone through wide desktop.

## Page scope

All existing user-facing pages receive the visual system and responsive pass:

- Root redirect/loading state.
- Login, register, and email verification.
- Dashboard overview.
- Accounts.
- LinkedIn workspace tabs: suggestions, scheduled, published, drafts, and comments.
- Posts list and new-post editor.
- AI settings.
- Quota.
- Settings.
- Admin.

The LinkedIn workspace will be split into focused components where practical, but behavior remains compatible with current routes and TanStack Query keys.

## LinkedIn engagement architecture

Add a server-only LinkedIn client with these responsibilities:

- Build a canonical post URN from `platformPostId` or stored LinkedIn metadata. No multi-URN guessing loop.
- Send every versioned request through `https://api.linkedin.com/rest` with `Linkedin-Version: 202607` and `X-Restli-Protocol-Version: 2.0.0`.
- Fetch reaction and comment totals from `/rest/socialMetadata/{encodedPostUrn}`.
- Fetch real comment records from `/rest/socialActions/{encodedPostUrn}/comments`.
- Parse LinkedIn error bodies into a typed result: `ok`, `permission_required`, `token_expired`, `rate_limited`, or `upstream_error`.
- Never substitute stock avatars, invented names, generated comments, or hard-coded engagement totals.

`GET /api/posts` will accept and honor the existing `platform` filter, return stored posts immediately, sync published LinkedIn posts through the client, persist successful totals, and include an `engagementSync` status on each published post. A successful empty response means zero; an unavailable response remains unavailable rather than being displayed as zero.

`GET /api/comments` will return real comments plus a top-level sync status. It will not call the AI provider while fetching. AI reply generation remains an explicit user action. A comment retains the post URN and numeric LinkedIn comment ID needed for a valid reply request.

`POST /api/comments` will validate input with Zod, post replies to the post's comment collection, verify the LinkedIn response, and return an error if LinkedIn rejects the request. The UI will only show “sent” after confirmed success.

The OAuth callback will persist the scopes actually granted by LinkedIn. Account UI will show whether engagement read access is available and prompt reconnection or developer-product approval when it is not.

## Data truth rules

- `0` is shown only when LinkedIn successfully returns a zero count.
- `—` and an explanatory state are shown when metrics cannot be read.
- Cached values are marked stale if the latest sync fails.
- The comment list never fabricates profile fields; unavailable actor details use a neutral initials placeholder and “LinkedIn member.”
- API warnings are returned to the client in structured data, not only logged on the server.

## Error handling

All touched API routes follow `{ data: ... }` on success and `{ error: { code, message, details? } }` on failure. LinkedIn-specific failures map to actionable UI notices:

- 401: reconnect the LinkedIn account.
- 403: LinkedIn read permission or Community Management product access is required.
- 429: keep cached data and show a retry-later state.
- 5xx/network: keep cached data and show a temporary sync failure.

## Testing and verification

- Unit tests cover canonical URN parsing, social metadata parsing, comment parsing, and LinkedIn error mapping.
- Route tests cover real zeros, successful counts, permission failures, and reply failure propagation.
- UI tests cover unavailable metrics and comment sync messaging where the current test stack permits.
- Type-check and production build must pass.
- Browser verification covers desktop and mobile layouts, keyboard focus, overflow, and the main dashboard/account/platform/auth flows.

## Boundaries

- No synthetic engagement or seeded comments will be presented as live data.
- No new social network integration is added.
- No third-party authentication or component framework is introduced.
- LinkedIn read access cannot be bypassed in code; the product will clearly explain when LinkedIn has not granted the required restricted permission.
