# Implementation Plan — Six UI/UX Fixes (KlimaGuard PH)

Framework: Next.js 16.3.8 App Router, React 19, TypeScript strict, Tailwind CSS v4 (no config file — `@theme` + CSS vars in `src/app/globals.css`, `@custom-variant dark`). Verification for every item: PowerShell, chain with `;` →
`npm run lint ; npm run build`. Do NOT run `npm run dev` blocking. Do NOT commit. Filipino is default; English is the i18n fallback.

Design decisions recorded inline (no separate design doc). Where two approaches were viable, the chosen one and its reason are stated.

---

## Issue 1 — Seamless custom scrollbars (globals.css only)

- [ ] 1. Add a global, theme-aware custom scrollbar to `src/app/globals.css`.
      Decision: pure CSS in globals.css (no component changes) — the request is "every scrollbar in the system", so a single global rule is the lowest-risk, most complete approach. Use `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb:hover` (Chromium/Safari) plus `scrollbar-width: thin` and `scrollbar-color: <thumb> transparent` (Firefox) on `html`/`*`. Thin (8px), rounded thumb (`border-radius: 9999px`), transparent track, no arrow buttons (`::-webkit-scrollbar-button { display: none }`), teal-tinted muted thumb using existing `--teal`/color-mix so it is subtle on both themes. Add dark overrides under `.dark`. Scope the thumb color via CSS vars (`--sb-thumb`, `--sb-thumb-hover`) defined under `:root` and `.dark`. Explicitly applies to horizontal scrollers too (the municipal `ModuleNavBar` tab bar) — a single `*`/`html` rule covers both axes. Do NOT touch `.bg-alert`/Alert Red — scrollbar colors are independent.
      Files: `src/app/globals.css`
      Verify: `npm run lint ; npm run build` succeed; manual: the municipal module tab bar and any overflow area show the thin teal-tinted rounded scrollbar in light and dark.

---

## Issue 2 — Emergency message overlap

Root cause (confirmed): the global `AlertBanner` (root `layout.tsx`, `sticky top-0 z-50`) and the municipal `MunicipalOverrideBar` (`MunicipalCommandView.tsx`, `relative z-50`) both render at the top during an active hazard/emergency, stacking over each other. Secondarily, `MunicipalOverrideBar`'s single flex row (`flex-wrap` + long `mun.override` text + 911 button) can crowd at 375px, and `AlertBanner`'s three stacked `<p>` lines + buttons need guaranteed spacing.

- [ ] 2. Prevent the global `AlertBanner` from co-rendering with the municipal override bar, and harden both for small screens.
      Decision: suppress the global `AlertBanner` on the municipal command view (which already has its own always-on `MunicipalOverrideBar`) rather than restyling z-index, because two red emergency strips are the actual overlap. Simplest robust mechanism: give `AlertBanner` a guard so it does not render when the municipal override bar is present. Implement by having `MunicipalCommandView` render inside a container with a known marker and checking pathname `/dashboard` + lgu is not reliable from layout; instead add an optional `suppressWhenOverrideActive` is overkill. Chosen concrete approach: in `AlertBanner`, read `usePathname()` from `next/navigation`; when pathname starts with `/dashboard`, return null (the dashboard shells own their emergency UI). This is a one-line guard and keeps the home/other pages' banner intact.
      Then: in `AlertBanner`, ensure the headline / affected-area / timestamp lines and the Call-911/close buttons never overlap — the column container already uses `flex-col gap-3`; keep `min-w-0` and add `break-words` to the text block so long typhoon names wrap; keep the button group `flex-wrap` so 911/Isara wrap under the text at 375px.
      In `MunicipalOverrideBar`, change the row to `flex-col gap-2 sm:flex-row sm:items-center` so the long `mun.override` line sits above the 911 button on narrow screens; add `break-words`/`leading-snug` to the text span. Keep `bg-alert` and 44px 911 target.
      In `MunEmergencyPanel` header, the `flex-wrap` is already correct; add `gap-y-1` and `min-w-0 break-words` to the signal/wind `<p>` so the headline and signal line never collide at 375px.
      Files: `src/components/alerts/AlertBanner.tsx`, `src/components/dashboard/MunicipalOverrideBar.tsx`, `src/components/dashboard/MunEmergencyPanel.tsx`
      Verify: `npm run lint ; npm run build` succeed; manual at 375px: on `/dashboard` (lgu, emergency active) only ONE red strip shows and the signal headline, override line and 911 button stack cleanly; on `/` the hazard banner lines/buttons never overlap.

---

## Issue 3 — Missing English translations (hardcoded Filipino bypassing i18n)

Root cause (confirmed): `en.ts`/`fil.ts` and `munEn.ts`/`munFil.ts` are at key parity (en=fil=624, munEn=munFil=392), so the gap is NOT missing keys — it is hardcoded Filipino strings in components that never call `t()`. Confirmed offenders: `AlertBanner.tsx` ("Apektadong lugar", "Tawagan ang 911", "Isara", aria "Isara ang alerto"), `WeatherCard.tsx` (attribution "Ayon sa …", rain/umbrella warnings, "Halumigmig/Tsansa ng ulan/Hangin/Pakiramdam", "Kuha noong"), `WeatherPanel.tsx` ("Maghanap ng lokasyon…"), `ProjectTracker.tsx` (header/filters/empty-state/"Demo data"/"Kabuuang badyet" etc.). `ChatWidget.tsx` and `EmbedCard.tsx` already carry local `{fil,en}` maps keyed by language and are NOT broken. `ForecastStrip.tsx` already branches on `language` and is fine.

- [ ] 3. Add the missing dictionary keys for the hardcoded strings to all four dictionaries.
      Decision: route everything through the existing i18n system (not local per-component maps) for the shell/weather/alert strings, so one toggle flips them. Add new keys to `fil.ts` AND `en.ts` (and, for any municipal-only strings, `munFil.ts` AND `munEn.ts`) keeping exact key parity (the dictionary types enforce this — a missing mirror key fails the build). New keys (prefixes): `alert.affectedAreas`, `alert.call911`, `alert.dismiss`, `alert.dismissLabel`; `weather.searchPrompt`, `weather.sourcePagasa`, `weather.sourceOpenMeteo`, `weather.heavyRain`, `weather.umbrella`, `weather.humidity`, `weather.rainChance`, `weather.wind`, `weatherfeelsLike` → use `weather.feelsLike`, `weather.updatedAt` (with `{time}` var); `transparency.*` for ProjectTracker header/filters/empty/demo/budget labels. Provide Filipino values identical to the current hardcoded text and natural English translations.
      Files: `src/lib/i18n/fil.ts`, `src/lib/i18n/en.ts` (and `src/lib/i18n/munFil.ts`, `src/lib/i18n/munEn.ts` only if any added key is `mun.`-scoped)
      Verify: `npm run lint ; npm run build` — the `Record<ITranslationKey,string>` typing fails if a key is added to one dict but not its mirror, so a green build proves parity.

- [ ] 4. Replace the hardcoded Filipino strings in the components with `t(...)` calls.
      Decision: `WeatherCard.tsx` is currently a server-safe module with no `"use client"`; it must consume language. Make it `"use client"` and call `useLanguage()` (its only parent `WeatherPanel` is already a client component, so this adds no RSC-boundary cost and keeps one-component-per-file). Pass the active `language` into `formatManilaTime` so the locale ("fil-PH" vs "en-PH") matches. For `AlertBanner`, `WeatherPanel`, `ProjectTracker` call `useLanguage().t`. Interpolate `{time}`/`{areas}` via the `t(key, vars)` signature. Keep Alert Red classes unchanged.
      Files: `src/components/alerts/AlertBanner.tsx`, `src/components/weather/WeatherCard.tsx`, `src/components/weather/WeatherPanel.tsx`, `src/components/transparency/ProjectTracker.tsx`
      Verify: `npm run lint ; npm run build` succeed; manual: toggle EN on `/` and `/transparency` — weather card, search prompt, hazard banner and project tracker all switch to English; FIL remains default.

---

## Issue 4 — Municipal Overview cognitive load (progressive disclosure)

Current `MunOverviewPanel` renders, top to bottom and all expanded at once: optional `MunEmergencyPanel`, `MunicipalDashboardCards` (10 cards), 3 `MunicipalSiteTile`s, `MunicipalStatGrid` (9 stat cards), `MunicipalRiverMonitor`, then `MunicipalDirectivePanel` + `AgencySyncPanel`. Everything competes for attention. All of these are existing, data-backed components that MUST be preserved.

- [ ] 5. Introduce a reusable collapsible section wrapper and restructure `MunOverviewPanel` into a prioritized, progressively-disclosed layout.
      Decision: do NOT delete or merge any panel — wrap the lower-priority groups in collapsible `<details>`-based sections (native, zero-JS, keyboard-accessible, no new deps) so the official sees an at-a-glance summary first and expands for detail. Native `<details>/<summary>` is chosen over a stateful React accordion because it is accessible by default, SSR-safe, and hackathon-fast; style the marker via Tailwind.
      Create `src/components/dashboard/MunCollapsibleSection.tsx` — a functional component with exported `IMunCollapsibleSectionProps { title: string; icon?: IconName; defaultOpen?: boolean; children: React.ReactNode; accent?: boolean }` rendering a styled `<details>` with a `<summary>` header (Poppins, teal icon, chevron) using existing `cmd-*` tokens; `font-ui`, 44px tap target, `dark:` variants.
      Restructure `MunOverviewPanel` IA (preserve all children):
        1. Emergency coordination (`MunEmergencyPanel`) — unchanged, ALWAYS first and never collapsed when `emergencyActive` (safety overrides). Prominent.
        2. "At a glance" — keep `MunicipalDashboardCards` (it is already the KPI summary) directly visible, NOT collapsed.
        3. Collapsible "Field telemetry" (`defaultOpen={false}`) — the 3 `MunicipalSiteTile`s.
        4. Collapsible "Command metrics" (`defaultOpen={false}`) — `MunicipalStatGrid`.
        5. Collapsible "Riverine & coastal monitor" (`defaultOpen={false}`) — `MunicipalRiverMonitor`.
        6. Collapsible "Directives & agency uplink" (`defaultOpen={false}`) — `MunicipalDirectivePanel` + `AgencySyncPanel`.
      Section titles use existing `mun.sec.*`/`mun.tab.*` keys where available (e.g. `mun.sec.tiles`, `mun.sec.stats`, `mun.sec.river`); add new `mun.sec.overviewGlance`, `mun.sec.directivesGroup` keys to `munFil.ts`+`munEn.ts` if no existing key fits. Mobile-first: single column at 375px, each section full width.
      Files: create `src/components/dashboard/MunCollapsibleSection.tsx`; modify `src/components/dashboard/MunOverviewPanel.tsx`; (if new keys) `src/lib/i18n/munFil.ts`, `src/lib/i18n/munEn.ts`; export the new component from `src/components/dashboard/index.ts` if the barrel pattern is used for siblings.
      Verify: `npm run lint ; npm run build` succeed; manual at 375px: Overview shows emergency (if active) + KPI cards first; telemetry/metrics/river/directives are collapsed and expand on click; no data or feature removed.

---

## Issue 5 — Seamless page transitions

Decision (doc-grounded): use a root `src/app/template.tsx` with a CSS fade/slide keyframe, NOT the experimental `viewTransition` config. Rationale from `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/template.md`: a `template.tsx` is re-created with a unique key on every navigation, so a CSS enter-animation on its wrapper fires on each route change with zero JS and no library. The React `<ViewTransition>` route-transition path (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) requires per-page wrappers + `transitionTypes` on every `<Link>` and only animates in Chromium 125+/recent browsers — more surface area and weaker cross-browser guarantees than a template fade for a hackathon. Keep ~200–250ms; respect `prefers-reduced-motion`; FCP unaffected (CSS only, no blocking JS).

- [ ] 6. Add a root template with a subtle fade-in and the matching reduced-motion-safe keyframe.
      Create `src/app/template.tsx`: a default component `Template({ children }: { children: React.ReactNode })` returning `<div className="kg-page-transition">{children}</div>`. Must NOT add `"use client"` (templates are Server Components by default per template.md) unless a hook is needed — none is.
      In `src/app/globals.css` add `.kg-page-transition { animation: kg-fade-in 220ms ease-out both; }`, a `@keyframes kg-fade-in` (opacity 0→1 + slight `translateY(4px)→0`), and `@media (prefers-reduced-motion: reduce) { .kg-page-transition { animation: none; } }`.
      Files: create `src/app/template.tsx`; modify `src/app/globals.css`
      Verify: `npm run lint ; npm run build` succeed; manual: navigating between `/`, `/dashboard`, `/transparency` fades content in (~220ms); with OS reduced-motion on, content appears instantly.

---

## Issue 6 — Official dashboard navigation entry point

Confirmed role API: `useAuth()` (`src/components/common/AuthProvider.tsx`) returns `{ session, ready }`; `session.role` is one of `"lgu" | "barangay" | "resident" | "farmer"`. Officials = `lgu` or `barangay` (matches `OFFICIAL_ROLES` in `src/lib/auth/scope.ts`). `AppHeader` (`src/components/common/AppHeader.tsx`) is rendered on `/`, `/dashboard` (resident/barangay shells), and inside `MunicipalCommandView`. Target route `/dashboard` exists and is already role-aware.

- [ ] 7. Add a role-gated "Dashboard" link in `AppHeader` visible only to officials.
      Decision: put the affordance in `AppHeader` (seen on every shell) rather than a per-page button, so it is consistently discoverable. Gate it with `useAuth()`: render the `<Link href="/dashboard">` only when `ready && (session?.role === "lgu" || session?.role === "barangay")`. Reuse the existing `isOfficial`-style check inline (do not import server-only `scope.ts`, which pulls `@prisma/client`/`next/headers`; replicate the two-role check client-side). Style with Poppins/`font-ui`, teal accent, 44px target, `focus-visible` ring, and the `Icon name="command"` (used elsewhere for the command center). Place it between the wordmark `children` slot area and the toggles, or in the right cluster before `LanguageToggle`.
      Label via i18n: add key `nav.dashboard` to `fil.ts` ("Dashboard" / "Command Center" FIL) and `en.ts`, call `t("nav.dashboard")`.
      Files: `src/components/common/AppHeader.tsx`; `src/lib/i18n/fil.ts`; `src/lib/i18n/en.ts`
      Verify: `npm run lint ; npm run build` succeed; manual: signed in as `mdrrmo.calamba` (lgu) or `brgy.sanroque` (barangay) the Dashboard link shows in the header and routes to `/dashboard`; signed in as a resident/farmer the link is absent.

---

## Final verification (all issues)

- [ ] 8. Full build + lint gate.
      Files: none (verification only)
      Verify: `npm run lint ; npm run build` both exit 0 with no new TypeScript/ESLint errors. Clean up any temporary files.
