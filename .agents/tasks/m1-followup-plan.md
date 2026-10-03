# Implementation Plan — M1 KlimaChat Follow-up (3 changes)

Project root (absolute): `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH`
Work directly in the workspace on `main`. No worktree.

Scope: (1) harden the Amazon Quick stub into an env-driven, swap-ready server module; (2) full light/dark theme with a user-facing toggle (replace the `prefers-color-scheme`-only CSS); (3) clear the two review findings (duplicated fallback string + private sub-components living in shared files). All framework code targets Next.js 16.3.8 App Router, React 19, TypeScript 5 strict, Tailwind CSS v4 (inline `@theme`, no `tailwind.config.js`).

Design decisions made during planning (grounded in the current code):
- The shared fallback string lives in `src/lib/constants/index.ts` as `CHAT_FALLBACK_MESSAGE`; the greeting also moves there as `CHAT_GREETING` so it has one home (both are already duplicated-in-spirit constants). Server route/quickClient import it as their fallback; `ChatWidget` imports it as its error message. This removes the duplication finding without changing any byte of the string.
- `useTheme()` ships from `src/components/common/ThemeProvider.tsx` (same file as the provider/context) rather than `src/hooks`, because the hook only reads this provider's context — colocating avoids a cross-module import cycle and keeps the context private to one file. `src/hooks/index.ts` stays as the `export {}` placeholder.
- `quickClient.ts` lives under `src/lib/agent/` (new folder) per structure.md's "lib/agent/*" mapping for M1, and is imported directly by the route handler. The `src/lib/api/index.ts` barrel is NOT touched (agent is not an API client; keeping it out of that barrel avoids any client-component importing a server-only module through the barrel).
- Theme is applied via Tailwind v4 class strategy: a `dark` class on `<html>`, a `@custom-variant dark`, and semantic `@theme` tokens so a single toggle flips the whole app. Brand Navy/Teal/Alert Red are constant across themes.

Exact shared strings (byte-for-byte, do not alter):
- Fallback: `Pasensya na, hindi ko pa nakukuha ang data. I-try ulit mamaya!`
- Greeting: `Kumusta! Ako si KlimaGuard 🌤️ Anong gusto mong malaman ngayon?`

Exact `@theme` tokens + hex (from product.md "Theme surfaces" + "Design Tokens"):
- `--color-app-bg`      → light `#FFFFFF` / dark `#0F1B2D`
- `--color-surface-2`   → light `#F7FAFC` / dark `#1A365D`  (secondary background)
- `--color-card`        → light `#FFFFFF` / dark `#16263D`
- `--color-text`        → light `#1A202C` / dark `#F7FAFC`  (primary text)
- `--color-text-muted`  → light `#4A5568` / dark `#A0AEC0`  (secondary text)
- `--color-navy`        → `#1A365D` (constant, brand)
- `--color-teal`        → `#38B2AC` (constant, brand/accent)
- `--color-alert`       → `#E53E3E` (constant, EMERGENCY only)
These map to Tailwind utilities `bg-app-bg`, `bg-surface-2`, `bg-card`, `text-text`, `text-text-muted`, `bg-navy`, `bg-teal`/`text-teal`/`border-teal`, `bg-alert`.

---

## Change 3a — Shared constants (do first; everything else imports from here)

- [ ] 1. Add the shared chat strings as named exports in the constants barrel.
      Replace the `export {}` placeholder in `src/lib/constants/index.ts` with two named exports: `export const CHAT_FALLBACK_MESSAGE = "Pasensya na, hindi ko pa nakukuha ang data. I-try ulit mamaya!";` and `export const CHAT_GREETING = "Kumusta! Ako si KlimaGuard 🌤️ Anong gusto mong malaman ngayon?";` (keep the two comment line optional). Both strings must be byte-for-byte identical to the current literals.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\lib\constants\index.ts`
      Verify: `npm run lint` passes (no unused/placeholder errors). Full build runs in step 12.

---

## Change 1 — Env-driven, swap-ready Amazon Quick client module

- [ ] 2. Add server-only Amazon Quick env vars (blank) to `.env.local`, mirroring the PAGASA pattern.
      In the "SERVER ONLY" section add, with explanatory comments that blank means the deterministic demo path is used and that these are server secrets (never `NEXT_PUBLIC_`): `QUICK_AGENT_ENDPOINT=`, `QUICK_AGENT_ID=`, `AWS_REGION=`. Do not add quotes or values.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\.env.local`
      Verify: visual — three blank keys present under SERVER ONLY, none prefixed `NEXT_PUBLIC_`.

- [ ] 3. Create the server-only Quick client module with `askKlimaAgent` and the moved `buildReply`.
      Create `src/lib/agent/quickClient.ts` (NO `'use client'`; it reads server env + will do SigV4 server calls). Export `async function askKlimaAgent(message: string): Promise<IChatResponse>`. Inside: read `process.env.QUICK_AGENT_ENDPOINT`, `process.env.QUICK_AGENT_ID`, `process.env.AWS_REGION`. If any required one is blank/undefined, return `buildReply(message)` (move the existing `buildReply` from the route into this module VERBATIM — same keyword switch, same Filipino replies, same weather embed). If configured, enter a single clearly-marked `// TODO(Amazon Quick):` block (commented that it must be a SigV4-signed server-side AWS request and that no secret may reach the client; do NOT implement SigV4 now) wrapped in `try/catch`; on catch (or until implemented) return `{ reply: CHAT_FALLBACK_MESSAGE }` imported from `@/lib/constants`. Import `IChatResponse` from `@/types`. No `any`, no `console.log`.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\lib\agent\quickClient.ts`
      Verify: `npm run lint` passes; module compiles in the build at step 12.

- [ ] 4. Refactor the chat route handler to call `askKlimaAgent` and use the shared fallback.
      In `src/app/api/chat/route.ts`: delete the inline `buildReply` (now in quickClient) and the local `FALLBACK_MESSAGE` const; import `CHAT_FALLBACK_MESSAGE` from `@/lib/constants` and `askKlimaAgent` from `@/lib/agent/quickClient`. Keep the `IChatRequestBody` interface, the `Partial<IChatRequestBody>` body parse, the `typeof body.message === "string" ? body.message : ""` coercion, and the `POST` signature `Promise<NextResponse<IChatResponse>>`. Replace `const payload = buildReply(message)` with `const payload = await askKlimaAgent(message);`. In `catch` return `NextResponse.json({ reply: CHAT_FALLBACK_MESSAGE }, { status: 500 })`. Keep a short comment noting the TODO now lives in quickClient.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\app\api\chat\route.ts`
      Verify: `npm run build` compiles the route; POST contract unchanged (checked at step 12).

---

## Change 2 — Full light/dark theme with user-facing toggle

- [ ] 5. Rewrite `globals.css` for the Tailwind v4 class-based dark strategy with semantic tokens.
      In `src/app/globals.css`: keep `@import "tailwindcss";`. Add `@custom-variant dark (&:where(.dark, .dark *));`. Define the semantic surface variables under BOTH `:root` (light values) and `.dark` (dark values) using the exact hex table above (`--app-bg`, `--surface-2`, `--card`, `--text`, `--text-muted`; plus constant `--navy #1A365D`, `--teal #38B2AC`, `--alert #E53E3E`). In `@theme inline`, expose them as the color tokens listed above (`--color-app-bg: var(--app-bg)`, `--color-surface-2`, `--color-card`, `--color-text`, `--color-text-muted`, `--color-navy`, `--color-teal`, `--color-alert`); KEEP `--font-sans`, `--font-mono`, and `--animate-typing-dot: typing-dot 1.2s ease-in-out infinite`. KEEP the `@keyframes typing-dot { ... }` block exactly. REMOVE the old `@media (prefers-color-scheme: dark) { :root { ... } }` block and the old `--background`/`--foreground` pair. Point the `body` rule at the semantic tokens: `background: var(--app-bg); color: var(--text);` (keep the font-family line).
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\app\globals.css`
      Verify: `npm run build` compiles CSS; typing-dot animation still referenced (step 12 + manual).

- [ ] 6. Create the client ThemeProvider with context, `useTheme()` hook, and persistence.
      Create `src/components/common/ThemeProvider.tsx` with `'use client'`. Define and export `interface IThemeProviderProps { children: React.ReactNode }`. Create a context typed `{ theme: "light" | "dark"; toggleTheme: () => void; setTheme: (t: "light" | "dark") => void }`. On mount (`useEffect`): read `localStorage.getItem("klimaguard-theme")`; if `"light"`/`"dark"` use it; else use `window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"`; default `"light"` if neither resolves. Apply by toggling `document.documentElement.classList` (`add`/`remove` `"dark"`). `setTheme`/`toggleTheme` update state, toggle the class, and persist via `localStorage.setItem("klimaguard-theme", next)`. Export a `useTheme()` hook that reads the context and throws a Filipino error if used outside the provider. No `any`, no inline styles, no `console.log`.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\common\ThemeProvider.tsx`
      Verify: `npm run lint` passes; compiles at step 12.

- [ ] 7. Create the accessible ThemeToggle button.
      Create `src/components/common/ThemeToggle.tsx` with `'use client'`. Define and export `interface IThemeToggleProps { className?: string }`. Use `useTheme()`; render an accessible `<button type="button">` with `aria-label="Palitan ang tema"` that calls `toggleTheme`. Show a sun/moon via inline SVG (no new deps) or text glyph chosen from `theme`. Style with Tailwind utilities only, teal accent (`text-teal`/`border-teal` or `bg-teal`), legible on the navy header in both themes, with a visible focus ring. No inline styles.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\common\ThemeToggle.tsx`
      Verify: `npm run lint` passes; compiles at step 12.

- [ ] 8. Export the theme pieces from the common barrel.
      Replace the `export {}` in `src/components/common/index.ts` with: `export { default as ThemeProvider, useTheme } from "@/components/common/ThemeProvider"; export type { IThemeProviderProps } from "@/components/common/ThemeProvider"; export { default as ThemeToggle } from "@/components/common/ThemeToggle"; export type { IThemeToggleProps } from "@/components/common/ThemeToggle";`
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\common\index.ts`
      Verify: `npm run lint` passes; `@/components/common` resolves at step 12.

- [ ] 9. Add the no-flash head script and wrap the app in ThemeProvider in the root layout.
      In `src/app/layout.tsx`: inside `<html>` add a `<head>` containing a single `<script dangerouslySetInnerHTML={{ __html: "..." }} />` whose script, synchronously before paint, reads `localStorage.getItem('klimaguard-theme')`, falls back to `matchMedia('(prefers-color-scheme: dark)').matches`, defaults to light, and `document.documentElement.classList.add('dark')` only when dark resolves (wrapped in try/catch to be safe). Add a comment that this inline script is the standard no-flash technique and the one accepted exception to the no-inline rule. Import `ThemeProvider` from `@/components/common` and wrap `{children}` inside `<body>`: `<body className="min-h-full flex flex-col"><ThemeProvider>{children}</ThemeProvider></body>`. Keep the Geist font vars, `LayoutProps<"/">` typing, metadata, and `<html lang="en" className=...>` as-is.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\app\layout.tsx`
      Verify: `npm run build` compiles; manual: first load with cleared storage + OS light renders light (no dark flash).

- [ ] 10. Convert chat surfaces to semantic theme-aware classes and mount the toggle.
      - `src/app/page.tsx`: change the wrapper from `bg-[#F7FAFC] dark:bg-[#0F1B2D]` to `bg-app-bg` (app background flips via token) — or `bg-surface-2` if the surrounding area should read as secondary; use `bg-app-bg` for the page shell. Keep `flex flex-1`.
      - `src/components/chat/ChatWidget.tsx`: swap panel `bg-[#1A365D]` → `bg-navy` (brand, constant both themes); keep `md:w-[60%] md:max-w-[60%]`, `border-white/10`, subtitle (`text-[#A0AEC0]` may stay or become `text-text-muted` on the navy panel — keep legible light-gray). Mount `<ThemeToggle />` in the `<header>` next to the title: wrap title/subtitle and the toggle in a `flex items-center justify-between` row so it stays clean at 375px and on desktop. Input stays `bg-white text-gray-800`; send button `bg-teal hover:bg-[#319795] text-white`; focus rings `ring-teal` where they were `ring-[#38B2AC]`. Import `ThemeToggle` from `@/components/common`.
      - Replace the `ERROR_MESSAGE` local const with `CHAT_ERROR_MESSAGE` imported as `CHAT_FALLBACK_MESSAGE` from `@/lib/constants` (used where `ERROR_MESSAGE` is referenced in the catch), and replace the `GREETING` local const with `CHAT_GREETING` from `@/lib/constants`. (Covers the Change-3 string de-duplication for the client side.)
      - `src/components/chat/MessageBubble.tsx` (and its extracted EmbedCard in step 11): user bubble `bg-white text-gray-800` → `bg-card text-text` (flips with theme); agent bubble stays `bg-teal text-white` (constant). EmbedCard surfaces use `bg-card text-text` and `text-text-muted` for the "Pinagmulan:" line (replace the `dark:bg-[#16263D] dark:text-[#F7FAFC]` / `dark:text-[#A0AEC0]` pairs); emergency alert keeps `bg-alert text-white` (`#E53E3E`, constant, legible both themes). Do not change rendered text/structure.
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\app\page.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\ChatWidget.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\MessageBubble.tsx`
      Verify: `npm run build` + `npm run lint` pass; manual: toggle flips page/bubbles/cards; navy panel and Alert Red unchanged across themes; AA contrast holds.

---

## Change 3b — Extract private sub-components to their own files

- [ ] 11. Extract TypingIndicator and EmbedCard into their own files and re-import them.
      - Create `src/components/chat/TypingIndicator.tsx` (no `'use client'` needed — it is presentational; it will render inside the client ChatWidget). Move the current `TypingIndicator` JSX verbatim (the teal typing bubble with three `animate-typing-dot` spans). Define and export `interface ITypingIndicatorProps {}` (empty/optional) and type the component with it; default-export the component. Keep `bg-[#38B2AC]` → `bg-teal` to match the token conversion (output identical visually).
      - Create `src/components/chat/EmbedCard.tsx`. Move the `EmbedCard` body verbatim from `MessageBubble.tsx`; define and export `interface IEmbedCardProps { embed: IMessageEmbed }` (import `IMessageEmbed` from `@/types`); default-export the component. Apply the same semantic-token classes from step 10 (`bg-card text-text`, `text-text-muted`, emergency `bg-alert text-white`). Do not change rendered output.
      - Update `src/components/chat/ChatWidget.tsx` to delete its inline `TypingIndicator` and import `TypingIndicator` from `@/components/chat/TypingIndicator` (or the barrel). Update `src/components/chat/MessageBubble.tsx` to delete its inline `EmbedCard` and import from `@/components/chat/EmbedCard`.
      - Add to `src/components/chat/index.ts`: `export { default as TypingIndicator } from "@/components/chat/TypingIndicator"; export type { ITypingIndicatorProps } from "@/components/chat/TypingIndicator"; export { default as EmbedCard } from "@/components/chat/EmbedCard"; export type { IEmbedCardProps } from "@/components/chat/EmbedCard";`
      Files: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\TypingIndicator.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\EmbedCard.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\ChatWidget.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\MessageBubble.tsx`, `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\src\components\chat\index.ts`
      Verify: `npm run lint` passes (one component per file satisfied); compiles at step 12.

---

## Final verification

- [ ] 12. Run the full project checks and manual smoke test.
      Run `npm run lint` then `npm run build` from the project root; both must complete with no errors (TypeScript strict, no `any`, no `console.log`). Then `npm run dev` and manually confirm the PRESERVE list: greeting exact, error text exact, user bubbles right / agent bubbles left+teal, navy panel both themes, exactly one suggestion chip under the latest agent message and clicking it sends it, three-dot typing indicator while awaiting the API, input auto-focuses, Enter sends, send disabled when empty/loading, no role picker, Filipino-first text, 375px full-width + ~60% desktop panel. Theme: first load (cleared `klimaguard-theme`, OS light) renders light with no flash; the header toggle flips the whole app and persists across reload; Alert Red legible in both themes.
      Files: none (verification only).
      Verify: `npm run lint` and `npm run build` exit 0; manual checklist above passes.

---

## Gaps / assumptions
- No test runner is configured (package.json has only lint/build/dev); verification uses `npm run lint` + `npm run build` + a manual smoke test, per tech.md. Not adding a test runner for this change set.
- `server-only` package is not installed; quickClient stays server-only by convention (imported solely by the route handler, reads non-`NEXT_PUBLIC_` env). If the implementer wants a hard guard, installing `server-only` and importing it at the top of `quickClient.ts` is optional and in-ecosystem.
- The surrounding page shell uses `bg-app-bg`; if visual review prefers the secondary tone, switch to `bg-surface-2` — single-line change, noted in step 10.
