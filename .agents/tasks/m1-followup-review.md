# M1 KlimaChat follow-up: Quick client extraction, light/dark theme, de-duplication

This follow-up hardens the Amazon Quick stub into an env-driven server-only module, adds a full light/dark theme with a user-facing toggle, and clears two prior review findings (a duplicated fallback string and two private sub-components living inside shared files). All three changes land as the plan describes: the chat agent logic now sits behind `askKlimaAgent` in `src/lib/agent/quickClient.ts` with a clearly marked SigV4 TODO, the theme flips via a `dark` class on `<html>` driven by semantic `@theme` tokens with a no-flash head script, and the fallback/greeting strings have a single home in `src/lib/constants/index.ts`. The verification note records `npm run lint` and `npm run build` both exiting 0, so I trusted that evidence and did not re-run the suites.

Watch for: nothing blocking. (possible) The `ThemeProvider` mount effect defers its `setThemeState` through a microtask with an `active` guard — an unusual pattern whose only effect is state reconciliation, harmless but worth a glance. (confirmed) `page.tsx` renders a `WeatherPanel` at 40% beside the chat panel; this is outside the three M1 changes but does not regress the ~60% chat panel requirement.

**Verdict**: APPROVED

## High-level view

CHANGE 1 is correct. `quickClient.ts` has no `'use client'`, exports `askKlimaAgent`, carries `buildReply` moved verbatim, reads only non-public env (`QUICK_AGENT_ENDPOINT`, `QUICK_AGENT_ID`, `AWS_REGION`), falls back to `buildReply` when any is blank, and wraps the real-call path in try/catch returning the shared Filipino fallback behind a clearly marked `TODO(Amazon Quick)` SigV4 block. The route handler calls `await askKlimaAgent(message)`, keeps the `Partial<IChatRequestBody>` coercion and the 500 catch, and is the sole importer of the module. The three new keys are present and blank under SERVER ONLY in `.env.local`.

CHANGE 2 is correct. `globals.css` declares `@custom-variant dark`, defines surface vars under `:root` and `.dark` with the exact product.md hex values, exposes them through `@theme inline`, keeps the `typing-dot` keyframes and animation token, drops the old `@media (prefers-color-scheme: dark)` block, and points `body` at the semantic tokens. `ThemeProvider` and `ThemeToggle` are client components with exported I-prefixed props, barrel-exported from `common`, using localStorage key `klimaguard-theme`, defaulting to light, toggling `dark` on `documentElement`. `layout.tsx` carries the commented no-flash head script and wraps children in `ThemeProvider`. The toggle is mounted in the ChatWidget header; the navy panel stays navy in both themes and Alert Red is constant.

CHANGE 3 is correct. `CHAT_FALLBACK_MESSAGE` is defined once and imported byte-identically by the route, the quick client, and `ChatWidget`. `TypingIndicator` and `EmbedCard` are extracted into their own files with exported I-prefixed props and are barrel-exported from the chat index; markup is unchanged apart from the hex-to-token swap.

The PRESERVE list holds: greeting and error strings are byte-exact, bubble sides and colors are intact, a single suggestion chip renders under the latest agent message, the three-dot typing indicator and auto-focus/Enter-send/disabled-when-empty behavior survive, there is no role picker, text is Filipino-first, and the layout is full-width on mobile with a ~60% desktop chat panel.

<details>
<summary>Issues (0)</summary>

No blocking or non-blocking action items. Two informational observations (ThemeProvider microtask reconciliation; the 40%/60% split in page.tsx) are noted in the summary and require no change.

</details>

<details>
<summary>Details</summary>

## Env-driven Quick client, server-only (CHANGE 1)

`askKlimaAgent` reads the three server env vars with `?? ""`, treats configured as all-three-non-empty, and returns `buildReply(message)` on the blank/demo path. `buildReply` moved into the module verbatim — same keyword set (`panahon`/`ulan`/`weather`/`init`/`bagyo`), same Filipino replies, same weather embed with `source: "Open-Meteo"` attribution. The configured path is a single `try/catch`; the `try` contains only the `TODO(Amazon Quick)` comment spelling out that the real call must be SigV4-signed server-side with no secret reaching the client, then returns `{ reply: CHAT_FALLBACK_MESSAGE }` until implemented, and the `catch` returns the same fallback. No `'use client'`, no `any`, no `console.log`.

The route handler imports `askKlimaAgent` and `CHAT_FALLBACK_MESSAGE`, parses the body as `Partial<IChatRequestBody>`, coerces `message` with `typeof body.message === "string" ? body.message : ""`, awaits the agent, and returns the shared fallback with status 500 on throw. The `POST` signature stays `Promise<NextResponse<IChatResponse>>`. `quickClient` is imported only here — no client component reaches it, and it is deliberately kept out of the `lib/api` barrel. Server-only is enforced by convention (single server importer, non-public env) rather than the `server-only` package; the plan flagged that as an acceptable optional hardening, so it is not a gap.

```
client ──POST /api/chat──> route.ts ──> askKlimaAgent ──┬── blank env ─> buildReply (demo)
                                                        └── configured ─> SigV4 TODO ─> fallback
```

## Class-based theme with no-flash script (CHANGE 2)

The surface variables under `:root` and `.dark` match product.md exactly — light `#ffffff`/`#f7fafc`/`#ffffff`/`#1a202c`/`#4a5568`, dark `#0f1b2d`/`#1a365d`/`#16263d`/`#f7fafc`/`#a0aec0` — with Navy `#1a365d`, Teal `#38b2ac`, Alert `#e53e3e` constant. `@custom-variant dark (&:where(.dark, .dark *))` enables the class strategy and `@theme inline` maps each var to a color token. The `typing-dot` keyframes and `--animate-typing-dot` token are retained; the old `prefers-color-scheme` media block and the `--background`/`--foreground` pair are gone.

The no-flash script in `layout.tsx` reads `localStorage['klimaguard-theme']`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, defaults light, and adds `dark` only when dark resolves, inside try/catch, with a comment marking it as the one accepted inline exception. `ThemeProvider` reconciles the same precedence on mount and exposes `theme`/`toggleTheme`/`setTheme`; `useTheme` throws a Filipino message outside the provider. `ThemeToggle` is an accessible `<button type="button">` with `aria-label="Palitan ang tema"`, teal styling and a visible focus ring, legible on the navy header. The microtask-deferred `setThemeState` is unusual but behaviorally equivalent to a plain state set here; no correctness impact.

## Shared string + component extraction (CHANGE 3)

`CHAT_FALLBACK_MESSAGE` and `CHAT_GREETING` are the single source; the route, quick client, and `ChatWidget` all import `CHAT_FALLBACK_MESSAGE`, so the error text is identical by construction, and the greeting seeds the first agent message from the same constant. `TypingIndicator` and `EmbedCard` are standalone files with exported `ITypingIndicatorProps`/`IEmbedCardProps`, both barrel-exported; `ChatWidget` imports the former and `MessageBubble` the latter. The extracted markup matches the prior inline versions, with hardcoded hex replaced by the equivalent semantic tokens (`bg-teal`, `bg-card`/`text-text`, `bg-alert`), which render the same in light mode and add the intended dark variants. The emergency alert branch keeps `bg-alert text-white` so Alert Red stays legible in both themes.

</details>

<details>
<summary>File map</summary>

- `src/lib/agent/quickClient.ts` (new) — server-only `askKlimaAgent` + moved `buildReply` + SigV4 TODO.
- `src/app/api/chat/route.ts` (new/untracked) — calls `askKlimaAgent`, shared 500 fallback, contract unchanged.
- `.env.local` — three blank server-only Quick keys added under SERVER ONLY.
- `src/app/globals.css` — class-based dark variant, `:root`/`.dark` surface vars, `@theme` tokens, keyframes kept, media block removed.
- `src/components/common/ThemeProvider.tsx` / `ThemeToggle.tsx` (new) — provider/context/hook and accessible toggle.
- `src/components/common/index.ts` — barrel exports for the theme pieces.
- `src/app/layout.tsx` — no-flash head script + `ThemeProvider` wrap.
- `src/app/page.tsx` — `bg-app-bg` shell; WeatherPanel 40% + ChatWidget.
- `src/components/chat/ChatWidget.tsx` — semantic/navy tokens, mounted `ThemeToggle`, shared constants.
- `src/components/chat/MessageBubble.tsx` — imports extracted `EmbedCard`, token-based bubbles.
- `src/components/chat/EmbedCard.tsx` / `TypingIndicator.tsx` (new) — extracted sub-components.
- `src/components/chat/index.ts` — barrel exports for the extracted components.
- `src/lib/constants/index.ts` — `CHAT_FALLBACK_MESSAGE` + `CHAT_GREETING`.

Full diff: `git diff main` plus the untracked files listed above (the three new chat/agent files and `src/app/api/chat/route.ts` are untracked, not shown by `git diff`).

</details>
