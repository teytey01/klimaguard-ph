# Barangay Official Dashboard: Implementation Plan

## SCOPE REDUCTION (orchestrator override)

These rules override anything below that conflicts with them. The user wants this done faster, with less data.

1. **Data:** keep demo data minimal, max 2–3 items per list (teams, centers, reports, inventory rows, projects, checklist items). One static data file. `useState` only, with no localStorage persistence beyond the existing session/onboarding. The audit log lives in memory only.
2. **Features:** every matrix module still needs a visible, working panel, kept compact. M5/M6/M10/M11/M4 are each ONE small panel: 2–4 rows plus one working action where the matrix grants write access. No multi-step wizards (CDRA/LCCAP are progress rows). DANA is a short form + submit + 3-hour countdown. The Operations Grid tab shows the Stitch cards. The other tabs may reuse the same card components with slightly more detail.
3. **Reuse** existing components and icons, adding at most ~3 new icons. Demo content strings (names, descriptions) may stay Filipino-only in the data file. Only UI chrome/labels go through `t()` in both en.ts and fil.ts.
4. **Login:** take the minimal option, i.e. the onboarding role choice sets the session role. No new auth system.
5. **Verify:** lint + tsc + ONE build. One quick browser pass at desktop light + 375 px, plus a single dark/EN spot check. No exhaustive screenshots.
6. **Review gate:** block only on HIGH issues (broken features, access-matrix violations, build failures, hard code-rule violations like `any`, inline styles, or `console.log`). Everything else is a non-blocking note.

All earlier concurrency rules still apply.

**Implementer note on rule 4:** the codebase moved on after this plan was written. A server-backed auth system (cookie sessions, `/api/auth/*`) now exists, built by another workflow, not this one. It already has an official username/password login (`POST /api/auth/login`). `PATCH /api/auth/profile` deliberately refuses to self-grant official roles from onboarding. Making the onboarding choice set `role: "barangay"` would mean weakening that server guard, which is a security/access-control regression. So the minimal path used here is the **existing** official login (no new auth built), plus one additive seeded account `brgy.sanroque` / `klimaguard2026` (Santa Cruz / San Roque) to match the design. `/dashboard` takes the role from the server session only, and `?role=` is ignored.

Workspace: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH` (main branch, NO worktree). Do NOT commit; the user commits.
Do NOT modify `.env.local` or the managed block in `AGENTS.md`.

Requirement sources (re-read the Barangay Official column before each panel):
`knowledgeFiles/klimaguard_ph_feature_access_matrix_v6.md` (Sections 1–12, 16), `knowledgeFiles/klimaguard_ph_project_documentation.md`, `.kiro/steering/{tech,structure,product}.md`.
Before framework code read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` and `use-search-params.md`.

## 0. Concurrency rules (a second workflow "municipal-official-dashboard" runs in the same workspace)

1. Do NOT edit `src/components/dashboard/*`, `src/lib/dashboard/*`, or the `CommandCenterView` function in `src/app/dashboard/page.tsx` (the municipal workflow may move it to its own file). You own the role-precedence / `?role=` guard and the barangay branch in `page.tsx`. Edit it with small targeted `str_replace` edits, re-reading the file right before each edit. Never rewrite the whole file. If `CommandCenterView` has moved/changed, adapt around it.
2. Shared files (`src/lib/i18n/en.ts`, `src/lib/i18n/fil.ts`, `src/types/index.ts`, `src/components/common/Icon.tsx`, `src/components/common/index.ts`, `README.md`, `package.json`): ADDITIVE small `str_replace` inserts only, re-read immediately before each edit, never remove/rename existing keys. New i18n keys are prefixed `brgy.`; new types are `IBarangay…`. Check the `IconName` union AND the `PATHS` record for duplicates before adding an icon (a duplicate `log-out` happened before).
3. Data consistency with the municipal dashboard: Barangay San Roque, San Roque Central Gym 300/400, San Roque Elem. standby 250 cap, 1,240 at risk in Purok 3 & 4, 2 resolved / 0 pending reports, San Roque Seawall 85% complete. Use exactly these figures as the initial state.
4. Builds share `.next`. Before `npm run build`, check for another running next build/dev (`Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select ProcessId,CommandLine`); if one is running `next build`, wait 60 s and retry. Use dev port **3000** (municipal uses 3100). Never kill processes you did not start. If tsc/lint/build fails only because of municipal in-progress files (`src/components/dashboard/*`, `src/lib/dashboard/*`, `CommandCenter*`), don't edit them. Note it and retry later.
5. `src/components/resident/*` is yours. The municipal workflow won't touch it.

## Baseline (verified this session)

- `npx tsc --noEmit` exits 0 and `npm run lint` exits 0 on the current tree.
- No test runner exists. Node is v24.19.0. I verified that `node --test` runs a `.test.mjs` that imports a `.ts` file directly (native type stripping), including `import type … from "@/types"`, since type-only imports are erased. That gives a zero-dependency test runner for PURE lib modules. Constraint: tested `.ts` files may only use `import type` for aliased modules. Any runtime import must be relative and include the `.ts` extension, so keep the tested files self-contained.

## DECISION POINT: how a user becomes role `barangay` today

Findings:
- `src/app/signin/page.tsx` (OTP, demo code 123456) ALWAYS creates `IAuthSession{ role: "resident" }` and routes to `/onboarding`.
- `src/app/onboarding/page.tsx` step 1 (`ROLE_CARDS` in `src/lib/onboarding/onboardingData.ts`) lets the user pick `barangay`. `finish()` saves the choice ONLY to localStorage `klimaguard-onboarding`. It never updates the session, so `session.role` stays `"resident"`.
- `src/app/dashboard/page.tsx` resolves `?role=` → `onboarding.role` → `session.role`. So today anyone can open `/dashboard?role=lgu`, and the session role is never the authority.
- `prisma/seed.mjs` seeds a barangay official (`brgy.parian` / `klimaguard2026`, Calamba/Parian). `src/lib/auth/session.ts` and `crypto.ts#verifyPassword` exist, but there is NO login route (`src/app/api/` has no auth endpoint) and no UI for username+password. The documented official login is therefore not wired.

Decision (minimal path): keep the existing **sign-in (OTP) → onboarding role selection** as the way to become `barangay`, and make the session authoritative:
- In onboarding `finish()`, also call `signIn({ ...session, role: completed.role })` so the chosen role is persisted INTO the session.
- The dashboard resolves the role from the session (`resolveDashboardRole`). It ignores `?role=` and strips any `?role=` that differs.
- Do NOT build username/password official login (that would be a new auth system: API route, cookie session, and a login UI on top of the prisma models). Flag it in the final report as the follow-up: "officials should use pre-created username+password accounts (seeded `brgy.parian`); not wired in this build."
- Flag in the final report: this is a client-side, localStorage-backed demo guard. It stops URL tampering in the UI but is not real authorization (someone with devtools can edit localStorage). Server-side enforcement needs the official login above.
- Demo tip for the report: pick Region IV-A → Laguna → **Santa Cruz → San Roque** in onboarding so the location matches the demo dataset. The dashboard title uses the onboarding barangay/municipality, defaulting to "San Roque" / "Santa Cruz".

## Design decisions

- **Separate `barangay` domain** (`src/components/barangay/*`, `src/lib/barangay/*`), one component per file. The resident dashboard stays untouched except for sidebar reuse. Mirrors the existing `resident` domain layout.
- **Sidebar: new `BarangaySidebar` sibling, not a generalized `ResidentSidebar`.** `ResidentSidebar` is typed to `IResidentTab`/`RESIDENT_MODULES`. A sibling copies its two required behaviors: `ROLE_NAV.filter(r => r.role === role)` (only "Barangay Official" visible) and the `res.logout` button (signOut + remove `klimaguard-onboarding` + `router.replace("/signin")`). This keeps the farmer/resident sidebar risk-free.
- **One view state `IBarangayView`** = 6 design tabs (`ops`, `evacuation`, `tanod`, `river`, `relief`, `reports`) + sidebar Active Modules (`chat` M1, `weather` M2, `drrm` M3/M7 checklist+DANA+QRF+affected pop+sitrep, `safety` M4, `agriculture` M5, `planning` M6, `analytics` M10, `transparency` M11, `audit`). The top tab bar shows the 6 design tabs. The sidebar lists modules. Every view renders a working panel.
- **State: `BarangayOpsProvider` (React context + `useState`)**, persisted to localStorage `klimaguard-brgy-ops` (demo-grade). All mutations go through pure functions in `src/lib/barangay/barangayOps.ts` (unit tested) and append an audit entry `{ who: session.name + " (Barangay Official)", when: ISO, what }`. Until hydration finishes, the provider's `ready` flag drives skeleton loaders.
- **Emergency state** comes from `useAlerts()`. When `state.hasActiveHazard && alert`, the dashboard shows the red critical-override strip, the red `STATUS: ALERT LVL {signal}` pill, and auto-surfaces the pre-disaster checklist. Otherwise it uses a teal "Normal" pill and no red strip. Alert red is used ONLY for emergency/critical states. The global `AlertBanner` in `layout.tsx` is left alone. At runtime, check that the stacked banners still read cleanly at 375 px (keep the barangay strip compact, one line plus truncate).
- **Progress/threshold bars without inline styles**: reuse the static-width snapping approach from `BudgetTracker.widthClass`. Put a `widthClass(pct)` in `barangayOps.ts` with the literal class list in a comment so Tailwind v4 scans it. The sparkline is an `<svg><polyline points=…/></svg>` (attribute, not style).
- **M2 full detail**: `/api/weather` only returns daily+current. Add a client fetch `fetchBarangayHourly(lat, lon)` in `src/lib/api/barangayWeather.ts` that calls `${NEXT_PUBLIC_OPEN_METEO_BASE}/forecast` with `timezone=Asia/Manila`, `hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,uv_index`, `forecast_days=2`. It caches in memory for 15 min, uses try/catch, and throws a Filipino error. Shown beside the existing `WeatherPanel` (7-day). This does not touch the shared weather lib/route.
- **M11 municipal budget**: `transparencyData.ts` only has Leyte/Samar. Define a Santa Cruz, Laguna `ITransparencyData` in `barangayData.ts` from the prisma seed figures (₱41,200,000 allocated / ₱25,544,000 spent, 4 lines) and render `<BudgetTracker data=… context="official" />` view-only (no upload button). Own-barangay projects are editable (status + completion %). Other San Roque-municipality barangay projects are view-only. Community reports respond/resolve live in the Reports tab.
- **Tests**: add `"test": "node --test \"tests/**/*.test.mjs\""` to `package.json` and `tests/barangay/*.test.mjs` for the pure modules. No new dependencies.

## Data model (append to `src/types/index.ts`, section `// === Barangay Official dashboard ===`)

```ts
export type IBarangayView = "ops"|"evacuation"|"tanod"|"river"|"relief"|"reports"|"chat"|"weather"|"drrm"|"safety"|"agriculture"|"planning"|"analytics"|"transparency"|"audit";
export type IBarangayEvacStatus = "standby"|"open"|"near-full"|"full";
export interface IBarangayEvacCenter { id: string; name: string; purok: string; occupancy: number; capacity: number; active: boolean; }   // status derived
export type IBarangayTeamStatus = "patrol"|"standby"|"security"|"logistics"|"dispatched";
export interface IBarangayTanodTeam { id: string; name: string; members: number; status: IBarangayTeamStatus; assignment: string; purok: string; updatedAt: string; }
export type IBarangayRiverStatus = "normal"|"watch"|"alert"|"critical";
export interface IBarangayRiverReading { at: string; levelM: number; }
export interface IBarangayRiverSensor { id: string; station: string; levelM: number; history: IBarangayRiverReading[]; normalMaxM: number; alertM: number; criticalM: number; lastPingSec: number; }
export interface IBarangayReliefItem { id: string; labelKey: string; quantity: number; unit: string; note: string; }   // labelKey typed ITranslationKey at the data layer
export interface IBarangayDistribution { id: string; purok: string; familiesServed: number; familiesTarget: number; packsGiven: number; at: string; }
export type IBarangayReportStatus = "pending"|"responded"|"resolved";
export interface IBarangayIncidentReport { id: string; title: string; location: string; status: IBarangayReportStatus; response?: string; reportedAt: string; resolvedAt?: string; }
export interface IBarangayChecklistItem { id: string; labelKey: string; done: boolean; }
export interface IBarangayDanaForm { startedAt: string|null; submittedAt: string|null; affectedFamilies: number; affectedPersons: number; dead: number; injured: number; missing: number; housesPartial: number; housesTotal: number; infrastructure: string; agricultureDamagePhp: number; needs: string; }
export interface IBarangayQrfEntry { id: string; label: string; amount: number; at: string; }
export interface IBarangayQrf { allocated: number; entries: IBarangayQrfEntry[]; }
export interface IBarangayPopulation { purok: string; individuals: number; families: number; evacuated: number; unaccounted: number; }
export interface IBarangayProject { id: string; name: string; barangay: string; completionPct: number; status: "planned"|"ongoing"|"completed"; editable: boolean; }
export interface IBarangayAuditEntry { id: string; at: string; who: string; what: string; }
export interface IBarangayOpsState { centers; teams; river: IBarangayRiverSensor; relief; distributions; reports; checklist; checklistActivatedAt: string|null; dana: IBarangayDanaForm; qrf: IBarangayQrf; population: IBarangayPopulation[]; projects; cropDamagePhp: number; audit: IBarangayAuditEntry[]; }  // fully typed arrays
```
(Use `ITranslationKey` for `labelKey` fields in `src/lib/barangay/*` interfaces where needed. If importing it into `types/index.ts` creates a cycle problem, keep those as `string` in types and cast-free typed in the data module via a local interface.)

## Initial demo data (`src/lib/barangay/barangayData.ts`), from the Stitch mock

- Population: Purok 3 (Riverside) 680 / 142 families; Purok 4 (Flood Basin) 560 / 118 families → 1,240 at risk; 194 high-vulnerability (Senior/PWD/Infant).
- Centers: `San Roque Central Gym` 300/400 active; `San Roque Elem.` 0/250 standby.
- Teams (12 active responders): Alfa 3 Tanod patrol Purok 3 Dike; Bravo 3 patrol Purok 4 Spillway; Charlie 3 gym security; Delta 3 logistics.
- River sensor `R-04` "Santa Cruz River Bank – Sector B": 3.10 m, normal <3.50, alert 4.50, critical 5.50, 6 h history rising +0.15 m/hr (e.g. 2.20→3.10), ping 12 s.
- Relief: 450 DSWD family food packs (Barangay Hall Cache), 600 gal water, 35 first-aid kits, 220 emergency mats; last count "Kagawad on duty, today 14:15 PST".
- Reports: "Clogged Culvert & Minor Runoff" (Purok 3 near chapel, resolved, cleared by Tanod Team Alfa, 30 min ago); "Fallen Acacia Branch obstructing alleyway" (Purok 2 access road, resolved, chainsaw crew, 2 h ago) → 2 resolved / 0 pending. Hotline `0917-555-ROQUE`.
- Connectivity (static card): 100% online; LoRa Radio Mesh → Municipal TOC Santa Cruz OPERATIONAL; Solar Genset battery 94%; Satellite LEO link READY; gym signal -68 dBm Strong.
- Projects: San Roque Seawall 85% ongoing (editable); San Roque Drainage Upgrade 40% (editable); 2 other Santa Cruz barangay projects (view-only, `editable:false`).
- QRF: BDRRMF ₱2,000,000 → QRF 30% = ₱600,000, one entry (e.g. ₱45,000 relief pack restock).
- Checklist (RA 10121 Sec. 12): alert residents (broadcast), check evac centers, pre-position relief goods, activate hotlines, deploy Tanod to river, pre-emptive evacuation of vulnerable in Purok 3 & 4, verify LoRa/genset, report readiness to MDRRMC.
- Planning (M6, barangay scope only): hazard profile (flood high, landslide low, storm surge none; source "HazardHunterPH / MGB / PHIVOLCS (demo data)"), CDRA 6 steps with done flags, LCCAP barangay inputs, projections (temp +1.0–1.2°C, rainfall +10–20% wet season by 2050, "CCC / PAGASA (demo data)"), SGLG scorecard indicators, deadlines as day offsets from today (e.g. 7/15/30 days → 30/15/7 reminder badges).
- Agriculture (M5 area-wide): barangay-wide pest warnings (e.g. rice black bug, armyworm), area crop-stress alerts (flood), crop-damage total ₱ (editable → prefills DANA agricultureDamagePhp), El Niño/La Niña "for advising farmers", livestock owner alert, harvest timing VIEW ONLY.
- Every surface source line: `t("brgy.source.ops")` = "Pinagmulan: NDRRMC / Barangay San Roque BDRRMC (demo data)". Weather uses Open-Meteo/PAGASA as returned, and alerts use `alertState.source`.

Also export `BARANGAY_TABS` (6 entries: id, labelKey, icon) and `BARANGAY_MODULES` (id, labelKey, icon, view), following the `RESIDENT_TABS`/`RESIDENT_MODULES` pattern.

## Implementation steps

- [ ] 1. Test runner + role guard + session-authoritative role.
      Add `"test": "node --test \"tests/**/*.test.mjs\""` to `package.json` scripts (additive). Create `src/lib/auth/roleGuard.ts` (pure, no imports except `import type { IUserRole } from "@/types"`): `resolveDashboardRole(sessionRole, onboardingRole): IUserRole` returns `sessionRole` when it is not `"resident"`, otherwise `onboardingRole ?? "resident"` (legacy sessions created before this change). Also `shouldStripRoleQuery(queryRole, role): boolean` = `queryRole !== null && queryRole !== role`. In `src/app/onboarding/page.tsx` `finish()`: use `signIn` from `useAuth()`. If `session` exists, call `signIn({ ...session, role: completed.role ?? "resident" })` before `router.replace("/dashboard")`. In `src/app/dashboard/page.tsx` (targeted str_replace ONLY on `DashboardInner`): compute `role = resolveDashboardRole(session.role, onboarding?.role ?? null)`, drop `queryRole` from precedence, and add a `useEffect` that calls `router.replace("/dashboard")` when `shouldStripRoleQuery(searchParams.get("role"), role)`. The effect must be declared before the early return (hooks rules) and guard on `ready && loaded && session?.verified`. Update the doc comment. Keep `lgu → CommandCenterView` and the resident/farmer fallback unchanged.
      Files: package.json, src/lib/auth/roleGuard.ts, src/app/onboarding/page.tsx, src/app/dashboard/page.tsx, tests/auth/roleGuard.test.mjs
      Verify: `npm test` passes (cases: barangay session ignores onboarding "lgu"; resident session + onboarding farmer → farmer; strip when query differs, not when equal or null); `npx tsc --noEmit` and `npm run lint` exit 0.

- [ ] 2. Types, demo data, and pure ops logic.
      Append the `IBarangay…` types above to `src/types/index.ts`. Create `src/lib/barangay/barangayOps.ts` (self-contained; only `import type`) with pure functions: `evacStatus(c)` (inactive → standby; ≥100% full; ≥80% near-full; else open), `setOccupancy(state, id, n)` (clamp 0..capacity), `toggleCenterActive`, `dispatchTeam(state, teamId, purok, assignment, now)` (status "dispatched", assignment/purok/updatedAt), `setTeamStatus`, `riverStatus(sensor)` (<normalMax normal; <alert watch; <critical alert; else critical), `logRiverReading(state, level, now)` (push history, keep last 12), `trendPerHour(history)`, `sparklinePoints(history, w, h)`, `setReliefQty`, `addDistribution` (validate packs ≤ food pack stock and deduct), `respondReport`/`resolveReport`, `reportCounts(reports)` → {pending, resolved}, `toggleChecklist`, `activateChecklist(now)`, `startDana(now)`, `danaRemainingMs(dana, now)` (3 h = 10,800,000 ms from startedAt, negative = overdue), `buildSitrep(state, barangay, municipality, now)` → Filipino multi-line SitRep "BDRRMC → MDRRMC" with population/evac/casualties/damage/needs/relief/QRF, `submitDana(now)`, `addQrfEntry` (reject amount ≤0 or > remaining), `qrfRemaining`, `setProjectProgress` (only `editable` projects; clamp 0–100; 100 → completed), `appendAudit(state, who, what, now, id)` (newest first, cap 200), `widthClass(pct)` (snapped literal classes, list them in a comment like BudgetTracker). Every mutation returns a new state. Callers append audit. Create `src/lib/barangay/barangayData.ts` with `INITIAL_BARANGAY_OPS`, `BARANGAY_TABS`, `BARANGAY_MODULES`, `SANTA_CRUZ_BUDGET: ITransparencyData`, planning/agriculture/analytics/connectivity static configs, and `BARANGAY_STORAGE_KEY = "klimaguard-brgy-ops"`. Create `src/lib/barangay/index.ts` barrel.
      Files: src/types/index.ts, src/lib/barangay/barangayOps.ts, src/lib/barangay/barangayData.ts, src/lib/barangay/index.ts, tests/barangay/barangayOps.test.mjs
      Verify: `npm test` passes with tests for evacStatus thresholds (300/400 → open, 340/400 → near-full, 400/400 → full, inactive → standby), dispatch, riverStatus at 3.10/3.60/4.60/5.60, reportCounts initial {pending:0,resolved:2} and after respond/resolve, DANA countdown + overdue, QRF over-limit rejection, sitrep contains barangay name and figures, distribution deducts stock, non-editable project unchanged. `npx tsc --noEmit` exits 0.

- [ ] 3. i18n keys and icons.
      Add all `brgy.*` keys used by steps 4–7 to BOTH `src/lib/i18n/en.ts` and `fil.ts` (Filipino default, Taglish-friendly; e.g. `brgy.dispatchCta` fil "I-dispatch ang Barangay Tanod Patrol"; `brgy.roleBadge` "Barangay Official"; `brgy.subtitle` with `{signal}`; tab/module labels; status labels; errors such as `brgy.error.generic` "May problema sa pagkuha ng datos. Subukang muli." + `brgy.retry` "Subukang muli"; `brgy.source.*`; empty-state suggestions). Insert as one block before the closing `} as const;` / `};` via str_replace (re-read first). Add icons only if needed (e.g. `"gauge"`, `"clipboard"`, `"siren"`, `"history"`) to BOTH the `IconName` union and `PATHS`, after checking for duplicates. Steps 4–7 may add more keys the same way. Keep en/fil keys identical (fil is `Record<ITranslationKey,string>`, so tsc catches missing ones).
      Files: src/lib/i18n/en.ts, src/lib/i18n/fil.ts, src/components/common/Icon.tsx
      Verify: `npx tsc --noEmit` exits 0 (proves key parity); `npm run lint` exits 0.

- [ ] 4. Provider, shell, sidebar, header, page wiring.
      Create in `src/components/barangay/` (each file: `"use client"`, exported `I…Props`, default export):
      - `BarangayOpsProvider.tsx` + exported `useBarangayOps()` hook (same file is OK because it mirrors `AuthProvider`/`useAuth`). Hydrates from localStorage in an effect (same `Promise.resolve().then` pattern as AuthProvider, try/catch, falls back to `INITIAL_BARANGAY_OPS`), persists on change, exposes `{ state, ready, actor, update(fn, auditText), reset }`. `update` applies the pure fn and `appendAudit` with `actor = "${session.name} (Barangay Official)"` from `useAuth()`.
      - `BarangaySidebar.tsx`: copy the ResidentSidebar structure. Operational role list = `ROLE_NAV.filter(r => r.role === "barangay")` only (the user's explicit requirement), showing the name under it. Active Modules = `BARANGAY_MODULES` → `onSelectView`. Logout button identical to resident (`res.logout`, `log-out` icon, signOut + remove `klimaguard-onboarding` + `router.replace("/signin")`). Telemetry footer "Brgy. {barangay}" + Online. Do NOT render the other 3 roles.
      - `BarangayCommandHeader.tsx`: red critical-override strip (only when hazard active), location pill "{municipality}, {province}", role pill `t("brgy.roleBadge")` (NEVER "Municipal Command"), status pill (red `STATUS: ALERT LVL {n}` in emergency, teal normal otherwise), title "Barangay {barangay}, {municipality}", subtitle, primary button "I-dispatch ang Barangay Tanod Patrol" → opens `DispatchTanodDialog`.
      - `DispatchTanodDialog.tsx`: accessible dialog (`role="dialog"`, `aria-modal`, focus first field, Esc closes): select team, select purok (Purok 1–7), optional assignment text; Confirm → `update(dispatchTeam…, "Nag-dispatch ng Team X sa Purok Y")`, success message, close; Cancel.
      - `BarangayDashboard.tsx`: props `{ barangay, municipality, province, name }`. Wraps `BarangayOpsProvider`, renders sidebar + header + `role="tablist"` of `BARANGAY_TABS` (overflow-x-auto, min-h-[44px]) + the view switch. Until steps 5–7 land, unimplemented views render a "skeleton" placeholder that step 7 removes (no view may remain a stub at the end). Shows a skeleton while `!ready`.
      - `index.ts` barrel exporting all components + props types.
      In `src/app/dashboard/page.tsx` (targeted str_replace, re-read first): import `BarangayDashboard` from `@/components/barangay`; after the `lgu` branch add `if (role === "barangay")` rendering `<div className="flex min-h-screen flex-col bg-surface-2"><AppHeader /><main …><BarangayDashboard barangay={onboarding?.location.barangay ?? "San Roque"} municipality={onboarding?.location.municipality ?? "Santa Cruz"} province={onboarding?.location.province ?? "Laguna"} name={session.name} /></main><HotlineFooter /></div>`. Do not touch `CommandCenterView`.
      Files: src/components/barangay/{BarangayOpsProvider,BarangaySidebar,BarangayCommandHeader,DispatchTanodDialog,BarangayDashboard}.tsx, src/components/barangay/index.ts, src/app/dashboard/page.tsx
      Verify: `npx tsc --noEmit`, `npm run lint`, `npm test` all pass.

- [ ] 5. The six design tabs (one file each).
      - `OperationsGridPanel.tsx`: the 7 cards from the mock, all derived from provider state (population, evac 75% bar via `widthClass` + remaining pax + standby, teams active count + per-team lines, river level + threshold bar + sparkline + "LIVE SENSOR R-04", relief on-hand, report counts + 2 latest + hotline, connectivity static). Each card has a badge and a source line. Card clicks jump to the matching tab (`onSelectView`). Grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
      - `EvacuationCentersPanel.tsx`: own centers only; occupancy number input + −10/+10 buttons (clamped), activate/deactivate standby center, status pill open/near-full/full/standby (full uses alert styling); totals; audit on every change.
      - `TanodPatrolsPanel.tsx`: team list with status select + assignment; "Dispatch" button per team opens `DispatchTanodDialog` preselected; recent dispatches from audit.
      - `RiverSensorsPanel.tsx`: level vs thresholds bar, status label, trend m/hr, sparkline, history list, "I-log ang manual gauge reading" numeric input (0–10 m). Watch = amber `text-cmd-accent`; alert/critical = `bg-alert`/`text-alert` + `role="alert"` message advising evacuation of Purok 3 & 4 (safety overrides).
      - `ReliefGoodsPanel.tsx`: editable inventory quantities (non-negative ints), "Huling bilang" timestamp + actor updated on save; Relief Distribution Tracker: add distribution (purok, families served/target, packs) with validation, per-purok progress bars, total served vs needed.
      - `IncidentReportsPanel.tsx`: own-barangay reports; filter all/pending/resolved; "Tumugon" opens inline textarea → `respondReport`; "Markahang resolved" → `resolveReport`; live pending/resolved counts; "Magdagdag ng ulat (walk-in/hotline)" form adds a pending report so the actions can be exercised; empty state with Filipino suggestion.
      Files: src/components/barangay/{OperationsGridPanel,EvacuationCentersPanel,TanodPatrolsPanel,RiverSensorsPanel,ReliefGoodsPanel,IncidentReportsPanel}.tsx, index.ts, BarangayDashboard.tsx
      Verify: tsc/lint/test pass.

- [ ] 6. DRRM ops + safety + chat + weather modules.
      - `PreDisasterChecklistPanel.tsx`: auto-activates (sets `checklistActivatedAt`) when `useAlerts` reports an active hazard with signal ≥2, else an "I-activate ang checklist" button; checkbox toggles with progress; audited.
      - `DanaFormPanel.tsx`: "Simulan ang DANA" starts the 3-h countdown (`setInterval` 1 s in an effect, cleared on unmount, shows hh:mm:ss, turns alert-red when overdue). Number/text fields; agriculture damage prefilled from `cropDamagePhp`; "Isumite sa MDRRMC" validates, sets `submittedAt`, shows `buildSitrep` output in a `<pre>`/readonly textarea with a copy button (`navigator.clipboard` in try/catch). Audited.
      - `QrfTrackerPanel.tsx`: allocated / spent / remaining with bar, add-expense form (rejects over-limit with Filipino error), entry list.
      - `AffectedPopulationPanel.tsx`: per-purok individuals/families/evacuated/unaccounted, editable evacuated/unaccounted, totals (barangay only).
      - `DrrmOpsView.tsx`: composes the four panels above + the sitrep "Reports UP to MDRRMC" note. Explicitly no BDRRMC-coordination or consolidated municipal DANA.
      - `SafetyCommunityPanel.tsx` (M4): resident alert broadcast template (editable Filipino text prefilled from the alert/signal + evac center) → "I-broadcast (SMS demo)" calls `smsProvider.send(["Purok 3 & 4 residents"], text, "hazard-alert", "Barangay San Roque BDRRMC")` from `@/lib/sms`, audited, and renders `<SmsBroadcastLog />`; community evacuation management guide (steps) and post-disaster DANA assessment guide (steps, link → drrm view).
      - `BarangayWeatherPanel.tsx` (M2): existing `<WeatherPanel />` (7-day) + hourly strip from `fetchBarangayHourly` (create `src/lib/api/barangayWeather.ts`; export via `src/lib/api/index.ts` additively, or import directly). Next 12 h temp/feels-like (heat), rain mm, wind km/h + direction, UV. Skeleton while loading, Filipino error + retry button, "Pinagmulan: Open-Meteo" attribution. Uses `useLocation()` lat/lon.
      - Chat view: `<ChatWidget />` in a `bg-cmd-surface` section (as in ResidentDashboard `ChatTab`, but in its own file `BarangayChatPanel.tsx`).
      Files: the files above, src/lib/api/barangayWeather.ts, index.ts, BarangayDashboard.tsx
      Verify: tsc/lint/test pass. Add a test for `buildSitrep` after DANA submit if not covered.

- [ ] 7. M5, M6, M10, M11, audit, and remove all placeholders.
      - `AgricultureAreaPanel.tsx`: area-wide pest warnings, crop-stress alerts (raise to flood stress when river status ≥ alert), editable barangay crop-damage total (feeds DANA), ENSO strategy "for advising farmers", livestock owner alert with "I-broadcast sa mga may-alagang hayop" (SMS demo + audit), harvest timing view-only (no edit controls). Source line.
      - `BarangayPlanningPanel.tsx` (M6): hazard profile, CDRA 6-step checklist (toggle), LCCAP barangay input textarea (save + audit), climate projections, SGLG compliance scorecard (own barangay %), deadlines with days remaining via `date-fns` `differenceInCalendarDays` and 30/15/7 badges. A note states CLUP and CCET are municipal-only (render NO CLUP/CCET tools).
      - `BarangayAnalyticsPanel.tsx` (M10, barangay scope): weather trend bars from `useWeather` forecast (skeleton/error+retry), OSM hazard-map iframe centered on Santa Cruz (14.2792, 121.4166) using `osmEmbedUrl` from `@/lib/onboarding/onboardingData`, risk bars, historical disasters list, projection chart bars, BDRRMF/QRF utilization bar. No crop-damage analytics, no all-barangay ranking.
      - `BarangayTransparencyPanel.tsx` (M11): `<BudgetTracker data={SANTA_CRUZ_BUDGET} context="official" />` labelled view-only; own projects with completion % range/number input + status (audited via `setProjectProgress`); other barangays' projects view-only; link to the Reports tab for respond/resolve; note "Ang pag-upload ng municipal budget ay para lamang sa Municipal Official." No upload control, no other municipalities.
      - `AuditLogPanel.tsx`: WHO/WHEN/WHAT table-free list (newest first), Asia/Manila time; "I-reset ang demo data" button with `window.confirm` → provider `reset` (audited).
      - Wire every `IBarangayView` in `BarangayDashboard.tsx`; delete the temporary placeholder. Every view now renders a working panel.
      Files: the files above, index.ts, BarangayDashboard.tsx
      Verify: tsc/lint/test pass; `npm run build` passes (follow concurrency rule 4).

- [ ] 8. Runtime verification + README.
      Start the dev server in the background on port 3000 (`npx next dev -p 3000`, run_in_background; do not block). Then verify by execution, with a browser tool if available. Otherwise record exactly which checks were done by HTTP/console and which remain manual:
      1. Sign in (any name, 0917xxxxxxx, OTP 123456) → onboarding → pick Barangay Official, Santa Cruz / San Roque → dashboard shows the Barangay dashboard (not Resident). Sidebar shows ONLY "Barangay Official", plus the Log out button that returns to /signin.
      2. `/dashboard?role=lgu` and `?role=resident` → URL is replaced with `/dashboard`, still the Barangay dashboard. A resident session with `?role=lgu` stays Resident. An lgu session (onboarding pick Municipal) still gets the command center. A farmer still gets the farmer/resident view.
      3. Dispatch dialog updates Tanod tab + ops card + audit. Evac occupancy edit changes the status pill (try 340 and 400). River reading 4.6 → alert styling. Relief edit + distribution deduct. Report add → respond → resolve updates counts. Checklist toggles. DANA countdown ticks, submit shows sitrep. QRF over-limit error. Project % edit audited. Broadcast appears in SMS log. Reload persists state.
      4. Light (default) + dark toggle, EN/FIL toggle on every view, 375 px width (no horizontal page overflow except the tab bar).
      Add a short "Barangay Official dashboard" section to README.md (additive): how to reach it, demo login steps, the client-side guard caveat, and the official username/password login as a known follow-up. Stop the dev server you started.
      Files: README.md (+ any fixes found)
      Verify: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass; runtime checklist results recorded in `.agents/tasks/barangay-verification.md`.

## Code rules checklist (apply to every file)

One component per file with exported `I…Props`; no `any`; no inline `style` (the onboarding progress bar's existing inline style is not ours to copy); no `console.log`; every fetch in try/catch with a Filipino fallback; skeleton loaders (animate-pulse blocks), never spinners; error = Filipino message + retry button; every data surface shows a source line; all user-facing labels via `t()` with `brgy.*` keys (proper nouns and demo record titles may stay as data); theme tokens `bg-cmd-surface`, `bg-cmd-tile`, `text-cmd-heading`, `text-cmd-muted`, `text-teal`, with `bg-alert`/`text-alert` only for emergency/critical; touch targets ≥44 px; import via `@/` aliases and barrels.

## Final report must flag

- The barangay role comes from onboarding role selection (now persisted into the session). Official username/password login (seeded `brgy.parian`) is NOT wired, so no new auth system was built.
- The role guard is client-side/localStorage (demo-grade), not server authorization.
- All barangay operations data is demo data persisted in localStorage `klimaguard-brgy-ops`. Hourly weather is live Open-Meteo.
