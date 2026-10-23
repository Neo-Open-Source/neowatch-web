<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NeoWatch Web

Next.js 16 App Router streaming catalogue for movies and TV shows. UI, data access and i18n are all in this repository.

## Commands

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

Use npm. Do not introduce another package manager or lockfile.

## Where things live

- `app/(main)/` — pages with the site shell (header, footer, mobile nav).
- `app/(player)/` — fullscreen player routes, no site chrome.
- `components/` — UI, cards, shelves, player.
- `lib/` — API, GraphQL, i18n, hooks, client state, utilities.
- `app/styles/` — the design system: tokens, layout and component styles.

Prefer finding and reusing an existing pattern over inventing a new one. If a component, hook, token or API helper already exists, use it.

## Next.js

- Server Components are the default. Add `"use client"` only for state, effects, browser APIs or event handlers.
- Fetch shared SSR data through `lib/api/server-data.ts` and pass it to client components as initial data. Do not fetch the same thing again on mount.
- Keep `loading.tsx` synchronous. It must not read cookies, headers or fetch data — otherwise the fallback cannot be prefetched and appears only after the page goes blank.
- A `loading.tsx` applies to its whole segment. Do not put a page-specific skeleton in a parent segment; scope it to the route or use `<Suspense>` inside the page.
- Loading UI renders inside the route layout. Do not duplicate page padding, max-width or vertical rhythm that `.page` already provides.
- Use `next/link`, `next/image`/`SmartImage`, and the existing metadata helpers.

## TypeScript and React

- `strict` is on. Avoid `any`; use the types in `lib/api/types.ts` or derive them.
- Keep components small and explicit. Extract a helper only when it removes real duplication, not to make the diff look architectural.
- Do not add state that mirrors props or derived values. Compute it.
- Prefer early returns over deeply nested ternaries.
- Every effect needs a reason to exist and correct cleanup. No effect for values that can be computed during render.
- Give lists stable keys; never use an index when the item has an id.

## Data and errors

- Keep API access inside `lib/api/*` and GraphQL inside `lib/graphql/*`. Components do not call `fetch` directly.
- Handle loading, empty, error and success states. Do not let a failure render as an endless skeleton.
- Never swallow an error without a visible fallback or a deliberate, commented reason.
- Do not invent backend fields. Check the API types and existing queries first.

## Text and i18n

- All user-visible text comes from `lib/i18n` dictionaries (`en`, `ru`, `uk`). No hard-coded UI strings.
- Add a key to the shared type and all three dictionaries when introducing copy.
- Keep labels short and action-oriented; errors must say what to do next.

## Styles

- Use the CSS files in `app/styles/` and the tokens in `tokens.css`.
- Class names follow the existing BEM-like pattern: `block`, `block__element`, `block--modifier`.
- Never hard-code colors, radii, spacing or card widths when a token exists. Add a token only when the value is genuinely shared.
- Keep responsive behaviour in media queries at the component or token level. Test 320px, mobile, tablet and wide desktop.
- Prefer logical properties (`margin-inline`, `inset-inline`) for direction-dependent layout.
- Animate only `transform` and `opacity`, gate motion behind `prefers-reduced-motion`, and do not animate skeletons.
- Tailwind is installed, but this project's UI is authored in the stylesheet system. Match the surrounding code instead of mixing approaches.

## Loading and skeletons

- A skeleton must mirror the loaded component's real wrappers and sizes, not a separate layout. Reuse `media-card`, `shelf-section`, `scroll-row`, `detail-*`, etc.
- Keep skeleton markup static and light. No hooks, focus handling or data access in a route fallback.
- Use `aria-hidden="true"` on decorative placeholders and keep them out of the tab order.
- Avoid layout shift: reserve the same aspect ratios, gaps and text line heights as the real content.

## Comments

- Comment *why*, not *what*. If the code is obvious, write nothing.
- One or two short lines maximum. No section banners, changelogs or restating the JSX.
- Document non-obvious constraints, browser workarounds and deliberate trade-offs only.
- No commented-out code and no `TODO` without an owner or issue.

## Anti-slop rules

- Do not rewrite or reformat files unrelated to the task.
- Do not add abstractions, config, dependencies or files “for the future”.
- Do not replace working project patterns with a framework or style you prefer.
- Do not invent APIs, fields, routes or design tokens.
- Do not add mock APIs or fake success responses.
- Do not hide errors with empty `catch` blocks or fallback text that says nothing.
- Do not write a comment where a clearer name would do.
- Do not claim something is tested if it was not run.

## Design work

For UI tasks, load the relevant skill from `../.agents/skills` through the `skill` tool before editing. For reviews use the `better-*` skills; for motion use `animate`, `review-animations` or `improve-animations`; for browser checks use `web-design-engineer`.

## Definition of done

- The requested behaviour works on desktop and mobile.
- `npx tsc --noEmit` and `npm run lint` pass, or the remaining output is explained.
- Loading, empty, error and narrow-width states were checked.
- The diff contains only the change that was asked for.
