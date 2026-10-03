# Implementation Plan — Municipal Official (role `lgu`) Command Center

## SCOPE REDUCTION (orchestrator override)

These rules override anything below that conflicts (the user wants this faster, with less data):

1. DATA: keep demo data minimal. Headline counts can still say "26 barangays", but all-barangay lists (evac centers, affected population, compliance ranking, reports, projects, DANA submissions, inventories) show only 4–5 barangays, including San Roque with the agreed figures. Max 2–3 items for other lists. One static data file; useState only, audit log in memory.
2. FEATURES: every matrix module still needs a visible, working panel, but keep it compact. M5/M6 (incl. CLUP + CCET as a few rows each)/M10/M11/M4 are each ONE small panel (2–4 rows plus one working action where write access is granted). No wizards. DANA PDF and TOC printout = window.print() of a print-styled section. SitRep broadcast = add an entry to SmsBroadcastLog + confirmation.
3. REUSE existing components/icons. Cut the planned 12 new icons to at most ~4 (reuse existing ones like command/chart/box/scroll/check/broadcast). Demo content strings may live in Filipino in the data file without EN translations; only UI chrome/labels go through t() in both en.ts and fil.ts.
4. VERIFY: lint + tsc + ONE build. One quick browser pass at desktop light + 375px, plus a single dark/EN spot check; no exhaustive screenshots.
5. REVIEW GATE: block only on HIGH issues (broken features, access-matrix violations, build failures, hard code-rule violations like any/inline styles/console.log); everything else is non-blocking notes.

All earlier concurrency rules still apply.

Scope: rebuild the `lgu` branch of `/dashboard` into a Stitch-matching, light-by-default MDRRMO Municipal Command Center for Santa Cruz, Laguna, covering the Municipal Official column of the v6 Feature Access Matrix (sections 1–12). Every action must change real state and show the result. Work on the current branch, no worktree, NO commits.

## Ground rules for the implementer

- Workspace root: `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH`. Next.js 16.3.8 App Router. Before writing framework code, skim `node_modules/next/dist/docs/` (client components and `useSearchParams` + Suspense). Nothing here needs a new route or server code.
- No test runner exists, and `package.json` is shared, so do not add one. Each item is verified with:
  - `npx tsc --noEmit` (strict type check, whole project), with zero errors.
  - `npx eslint <the files you touched>`, with zero errors.
  - `npm run build` only in the final item. The other workflow may be building at the same time. If `.next` is locked, wait and retry; never delete `.next`.
- Concurrency (a barangay-official workflow is editing this workspace right now):
  - Do NOT edit `src/components/resident/*`, `src/components/barangay/*`, `src/lib/barangay/*`, `src/lib/resident/*`, or the role-precedence / `?role=` guard code in `src/app/dashboard/page.tsx`.
  - Owned (free to create or edit): `src/components/dashboard/*`, `src/lib/dashboard/*`.
  - Shared, additive only: `src/types/index.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/fil.ts`, `src/components/common/Icon.tsx`, `src/components/common/index.ts`, `README.md`.
    - Re-read each file right before every edit.
    - Insert with small `str_replace` calls anchored on a stable line, such as the closing `} as const;` / `};` of the dictionaries, the `| "sprout";` tail of `IconName`, or the end of the file for types.
    - Never rewrite a whole file. Never rename or remove existing keys or types.
    - Use the `mun.` prefix for new i18n keys and `IMun…` / `IMunicipal…` for new types.
  - Do NOT edit `src/app/globals.css`, `src/app/api/**`, `prisma/**` or `package.json`.
- Code style (steering):
  - One component per file, with its props interface exported from the same file. No `any`. Interfaces use the `I` prefix.
  - Tailwind classes only, no inline `style=`. Use bar widths via Tailwind arbitrary classes such as `w-[62%]`. Dynamic percentages are not possible as arbitrary classes, so use `<progress>` / `<meter>` elements styled with Tailwind, or a 0–100 → class lookup in steps of 5 (`WIDTH_CLASS[Math.round(p/5)*5]`). Pick the lookup helper `pctWidthClass()` in `src/lib/dashboard/municipalFormat.ts` and use it everywhere.
  - No `console.log`. Every `fetch` gets try/catch with a Filipino fallback and a retry button. Loading states use skeletons, not spinners.
  - Every data surface shows a source attribution. All user-facing text defaults to Filipino.
  - Touch targets are at least 44px. The layout works at 375px width.

## Design decisions (made here, not left to the implementer)

1. **Tabs map to the real matrix modules.** The Stitch tab labels ("M1 Overview, M3 Hazard Risk, M2 Population Triage…") are numbered inconsistently with the documentation. The user said to follow the documentation, so the tab bar is:
   - Overview, M1 KlimaChat, M2 Panahon, M3 Hazard Risk, M4 Safety, M5 Agrikultura, M6 LGU Planning, M7 DRRM Ops, M8 Location, M9 Knowledge Base, M10 Analytics, M11 Transparency, plus a Settings view reached from the sidebar.
   - The Stitch labels become sub-sections: "Population Triage" sits inside M3, and "Evac Shelters" and "Logistics & Relief" sit inside M7.
   - M8 and M9 are "Background" in the matrix, but each still gets a small working status panel, because the brief wants one panel per module tab.
2. **Controlled tab state lives in `MunicipalCommandView`.** The sidebar and the tab bar must stay in sync. `ModuleNavBar` (owned) gains an optional `activeId` prop. When `activeId` is provided, the component is controlled. The existing internal-state behavior stays unchanged when `activeId` is omitted.
3. **One client store for all municipal edits: `src/lib/dashboard/municipalStore.ts`.**
   - It follows the `src/lib/sms/index.ts` pattern: module state, a `Set` of listeners, `subscribe` / `getSnapshot`, consumed with `useSyncExternalStore`.
   - `getServerSnapshot` returns the seed, so there is no hydration mismatch.
   - State persists to `localStorage["klimaguard-municipal-state-v1"]`. It loads lazily on the first client `getSnapshot` / `subscribe`, inside try/catch.
   - Actions are pure reducer functions over `IMunicipalState`, so they can be tested later. Every action appends an `IMunAuditEntry` (WHO/WHEN/WHAT). This is the demo-grade audit log.
   - Rationale: there is no DB model for municipal ops, and API and prisma files are off-limits.
4. **Community reports come from two sources.**
   - Live DB reports: `GET /api/reports` already scopes `lgu` users to their municipality, and `PATCH /api/reports/:id` lets an `lgu` respond or resolve. Both are used as-is when they succeed. Note: the seeded lgu user lives in Calamba, so DB reports may be Calamba ones. Show them under a "Live (DB)" heading with their own municipality label taken from `scopeLabel`.
   - Seeded Santa Cruz reports, including San Roque's 2 resolved / 0 pending, live in the municipal store. Resolve, respond and "submit for any barangay" work against the store.
   - `POST /api/reports` forbids `lgu`. Changing that API is outside our ownership. Gap noted: submission for any barangay is store-backed, not DB-backed.
5. **PDF and printouts use the browser print path.**
   - `MunicipalCommandView` holds `printMode: "none" | "dana" | "toc"`. Clicking a button sets it.
   - A `useEffect` calls `window.print()` once the print sheet is rendered. A `window` `afterprint` listener resets the mode.
   - App chrome gets `print:hidden`. The print sheet is `hidden print:block`, and Tailwind v4 ships the `print:` variant.
   - The DANA sheet prints the consolidated municipal DANA: totals plus a per-barangay table from the store. The TOC sheet prints stats, the evacuation table, directives and agency sync.
   - The user picks "Save as PDF" in the print dialog. Show a hint line under the button saying so.
6. **The SitRep broadcast uses the existing SMS layer.**
   - `smsProvider.send(recipients, message, "digest", "MDRRMO Santa Cruz")` from `@/lib/sms`. The `ISmsKind` union is not modified.
   - Recipients are PDRRMC Laguna plus the 26 BDRRMC chairs, as labeled placeholders like `"BDRRMC San Roque"`. No real numbers.
   - The message is built from live store totals.
   - The store also records an `IMunSitrep` (direction `"up"`, to PDRRMC) and an audit entry. `SmsBroadcastLog` renders in M1 (Chat & Comms) and M7.
7. **Theme: drop the forced dark.**
   - Remove the `cmd-dark` wrapper and `bg-[#0f1b2d]`. Use `bg-surface-2` as the page background and `bg-cmd-surface` / `bg-cmd-tile` / `text-cmd-heading` / `text-cmd-muted` on panels. These tokens are already theme-aware (light under `:root`, dark under `.dark`), so the existing ThemeToggle in `AppHeader` flips everything.
   - Emergency surfaces always use `bg-alert text-white`, which is legible in both themes.
   - Do not edit `globals.css`. Leave the unused `.cmd-dark` rule there.
8. **Santa Cruz weather.**
   - `useWeather({ name: "Santa Cruz", province: "Laguna", lat: 14.2818, lon: 121.4172, region: "CALABARZON" })` drives the header and Overview cards.
   - M2 "full" features (10-day, hourly, rainfall mm, soil moisture, wind direction) need fields the shared `/api/weather` route does not return. They get an owned client fetcher, `src/lib/dashboard/municipalWeather.ts`, that calls Open-Meteo directly.
     - Base URL: `process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://api.open-meteo.com/v1"` + `/forecast`.
     - Query: `timezone=Asia/Manila`, `forecast_days=10`.
     - `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant`.
     - `hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,soil_moisture_0_to_1cm`.
     - `current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation`.
     - 15-minute in-memory cache, try/catch, Filipino error.
   - The ENSO status reuses `DEMO_ENSO_PHASE` from `@/lib/agriculture/cropData`.
9. **Barangay roster.**
   - Santa Cruz's real barangays are: Alipit, Bagumbayan, Bubukal, Calios, Duhat, Gatid, Jasaan, Labuin, Malinao, Oogong, Pagsawitan, Palasan, Patimbao, Poblacion I–V, San Jose, San Juan, San Pablo Norte, San Pablo Sur, Santisima Cruz, Santo Angel Central, Santo Angel Norte, Santo Angel Sur.
   - The brief requires San Roque as one of the 26 and the count to stay 26, so **Santo Angel Central is replaced by San Roque**. This assumption is noted in code.
10. **Evacuation numbers are derived, never hard-coded in cards.**
    - Centers (total capacity 1,200, occupied 812, 4 of 6 open):

      | Center | Barangay | Occupied / Capacity | Status |
      | --- | --- | --- | --- |
      | Santa Cruz Central Convention Center (primary hub) | Poblacion I | 350/350 | full |
      | San Roque Central Gym | San Roque | 300/400 | open |
      | San Roque Elem. School | San Roque | 0/250 | standby |
      | Calios Covered Court | Calios | 98/100 | near-full |
      | Santo Angel Norte Multi-Purpose Hall | Santo Angel Norte | 64/70 | near-full |
      | Pagsawitan Covered Court | Pagsawitan | 0/30 | standby |

    - Results: 68% occupancy and 4/6 open, which match the mock.
    - Beds remaining is derived as capacity − occupied = **388**. The mock's "380" is inconsistent with its own 812/1,200, so the derived value is shown.
    - Editing occupancy recomputes every card.
11. **Affected households.** The per-barangay `affectedHouseholds` values must sum to exactly **1,420**. The card shows the computed sum.
    - San Roque: `atRiskResidents: 1240` ("Purok 3 & 4").
12. **Funds.**
    - LDRRMF ₱45,200,000 allocated, ₱28,100,000 spent, shown as 62% via `utilizationPct`.
    - The 70/30 split is derived as ₱31.64M / ₱13.56M.
    - Update the constants in `dashboardData.ts` so the legacy `getMunicipalDashboardData()` stays consistent.

## Data model additions

### Types (append to `src/types/index.ts`, additive, after the existing M6/M7 block)

- `IMunEvacStatus = "open" | "near-full" | "full" | "standby" | "closed"`
- `IMunEvacCenter { id; name; barangay; occupancy; capacity; status: IMunEvacStatus; isPrimaryHub?: boolean; supplies: string }`
- `IMunHazard = "flood" | "landslide" | "storm-surge" | "liquefaction"`
- `IMunBarangay`:
  - Identity and location: `id; name; lat; lon; setting: "coastal" | "riverine" | "upland" | "urban"; population`.
  - Hazard and DRRM: `hazards: IMunHazard[]; riskIndex /*0-10*/; atRiskResidents; atRiskNote?; affectedHouseholds; complianceScore /*0-100*/; bdrrmcOnline: boolean; ldrrmfAllocated; ldrrmfSpent`.
  - Agriculture: `cropDamagePhp; pestRisk: "low" | "medium" | "high"; pestNote; livestockHeads; pcicEnrolled; farmers`.
  - Relief and checklist: `inventoryFoodPacks; reliefDelivered; reliefNeeded; checklistAck: boolean`.
- `IMunDanaStatus = "not-submitted" | "submitted" | "approved" | "returned"`
- `IMunDanaReport { barangayId; status: IMunDanaStatus; submittedAt?; affectedFamilies; casualties; housesDamaged; infraDamagePhp; agriDamagePhp; reviewNote? }`
- `IMunProjectStatus = "planned" | "ongoing" | "completed" | "delayed"`
- `IMunProject { id; name; barangay /* "Munisipyo" for municipal */; budgetPhp; completionPct; status: IMunProjectStatus; contractor; updatedAt }`
- `IMunReport { id; barangay; title; body; status: IReportStatus; response?; createdAt; updatedAt }` (reuses the existing `IReportStatus`)
- `IMunCcetTag = "adaptation" | "mitigation" | "none"`
- `IMunBudgetLine { id; item; office; amountPhp; ccet: IMunCcetTag; ccetCode?: string }`
- `IMunChecklistItem { id; label; done: boolean; phase: "pre" | "during" | "post" }`
- `IMunSitrep { id; direction: "up" | "down"; from; to; summary; at }`
- `IMunDirectiveStatus = "enforced" | "signed" | "in-progress" | "pending"`
- `IMunDirective { id; title; detail; badge; status: IMunDirectiveStatus }`
- `IMunDeadline { id; scope: "municipal" | string /* barangay name */; title; dueDate /* yyyy-MM-dd */; basis }`
- `IMunLccapSection { id; title; progressPct; status: "draft" | "review" | "adopted" }`
- `IMunCdraStep { id; title; barangaysDone: number; done: boolean }`
- `IMunClupZone { id; zone; areaHa; hazardOverlap: IMunHazard[]; climateInformed: boolean }`
- `IMunAuditEntry { id; at; actor; action; target; detail }`
- `IMunicipalState`:
  - Core records: `barangays; centers; dana: IMunDanaReport[]; projects; reports; budget: IMunBudgetLine[]`.
  - Operations: `checklist; sitreps; directives; deadlines; lccap; cdra; clup`.
  - Depot and dispatch: `depot { foodPacks; waterKits; rescueTrucks; rubberBoats }; rcef: { barangayId; seedBags }[]`.
  - Emergency and audit: `emergencyActive: boolean; emergencyLevel: 1 | 2 | 3 | 4 | 5; audit: IMunAuditEntry[]`.
- `IMunModuleTab = "overview" | "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8" | "m9" | "m10" | "m11" | "settings"`

### Data (`src/lib/dashboard/dashboardData.ts`, owned; add exports and keep the existing ones working)

- Constants: `MUN_LOCATION` (Santa Cruz, 14.2818, 121.4172), `MUN_SOURCE = "Consolidated: NDRRMC · PAGASA · COA/DBM · OCD Region IV-A · MDRRMO Santa Cruz (demo)"`, and `MUN_OSM_EMBED`:

  ```
  https://www.openstreetmap.org/export/embed.html?bbox=121.37%2C14.24%2C121.47%2C14.32&layer=mapnik&marker=14.2818%2C121.4172
  ```

- `MUN_SEED_STATE: IMunicipalState`:
  - The 26 barangays from decision 9.
  - The 6 centers from decision 10.
  - DANA records for all 26:
    - San Roque, Calios and Santo Angel Norte are `submitted`.
    - Poblacion I and Bagumbayan are `approved`.
    - The rest are `not-submitted`.
  - Projects:
    - San Roque Seawall: barangay San Roque, 85%, ongoing, ₱5.2M.
    - Santa Cruz River Dredging Ph.2: Munisipyo, ongoing, 40%.
    - Plus 3 others (drainage in Pagsawitan, slope protection in Bubukal, early-warning sirens in Calios).
  - Reports:
    - San Roque: 2 reports, both `resolved`, with responses. This gives 0 pending.
    - Plus about 4 others: 2 open, 1 responded, across Calios, Gatid and Poblacion II.
  - Budget lines: about 8 municipal AIP lines with mixed CCET tags.
  - Checklist: 8 pre, 4 during and 4 post items.
  - Sitreps: received from the BDRRMCs of San Roque, Calios and Santo Angel Norte, direction "up" to MDRRMC.
  - Directives:
    - Preemptive Evacuation, ENFORCED (Calios + Santo Angel riverbank).
    - Relief Release Authorization, SIGNED - BATCH 3, ₱1.2M.
    - Engineering Bypass Re-inspection, IN PROGRESS (San Roque coastal bulkhead).
  - Deadlines: 3 municipal (LCCAP update, SGLG submission, CCET submission) and 4 barangay ones. Dates are relative to today, computed in a `buildSeed()` helper with `date-fns` `addDays`, so the 30/15/7 badges are meaningful.
  - LCCAP: 5 sections. CDRA: 6 CCC-HLURB steps with `barangaysDone` counts. CLUP: 5 zones.
  - Depot: `{ foodPacks: 4820, waterKits: 310, rescueTrucks: 6, rubberBoats: 4 }`.
  - `emergencyActive: true`, `emergencyLevel: 3`, `audit: []`.
- Static (non-editable) exports:
  - `MUN_HYDRO`: 4.12m, 5.50m critical, +1.38m margin, tide peak +0.42m at 21:15H, rate −0.05m/hr.
  - `MUN_STATION`: Brgy. Bagumbayan Bridge, 58% hydraulic capacity, no backwater from Laguna de Bay.
  - `MUN_AGENCIES`: OCD Region IV-A, PAGASA Doppler, OCD CALABARZON TOC, PAGASA Radar Tagaytay.
  - `MUN_SITE_TILES`: the 3 Stitch photo tiles with title, status and icon.
  - `MUN_TYPHOON`: demo track points, wind speed, signal, name; fallback when `useAlerts()` has no active hazard.
  - `MUN_PROJECTIONS`: 2036–2065 temperature, rainfall and sea-level changes for Laguna.
  - `MUN_DISASTER_HISTORY`: past events with year, affected people and damage.
  - `MUN_CROP_DAMAGE_TREND`: monthly ₱ values.
  - `MUN_CROP_CALENDAR`: palay, mais, gulay windows.
  - `MUN_SAFETY_GUIDE`: signal 1–5 steps, go-bag, route, health, eye-of-typhoon, crop, livestock, equipment, community evacuation management, DANA guide.
  - `MUN_COMPLIANCE_INDICATORS`: municipal SGLG indicators with pass/fail.
  - `MUN_KNOWLEDGE_SOURCES`: list of `src/lib/agent/knowledge/*.md` titles, for M9.
- Selectors in a new `src/lib/dashboard/municipalSelectors.ts` (pure):
  - `totalAffectedHouseholds`, `evacTotals` (occupied, capacity, pct, open count, beds remaining, primary hub).
  - `fundSummary` (allocated, spent, pct, qrf, mitigation).
  - `consolidatedDana` (sums over submitted + approved), `municipalCropDamage`.
  - `complianceRanking` (sorted desc), `pendingDeadlines(today)` (sorted, with `daysLeft` and a `badge` of 30/15/7/overdue).
  - `reportCounts`, `ccetTotals`.
- Formatting in `src/lib/dashboard/municipalFormat.ts`: `formatPhp`, `formatPhpShort` (₱28.1M), `pctWidthClass`, `formatTimeManila`.

### Store actions (`municipalStore.ts`)

Each action takes `actor: string`, which is `${session.name} (MDRRMO)`, and appends an audit entry. Inputs are validated. Invalid input returns `{ ok: false, error: <Filipino message> }`; otherwise `{ ok: true }`.

- `updateEvacOccupancy(centerId, occupancy)`: clamps 0..capacity and auto-derives status (100% → full, ≥85% → near-full, otherwise open; standby stays standby only if occupancy is 0).
- `setEvacStatus(centerId, status)`: open or standby a center.
- `reviewDana(barangayId, "approved" | "returned", note)`: only allowed from `submitted`. Returning requires a note.
- `setProjectProgress(projectId, completionPct, status)`: any barangay; 0..100; 100 forces `completed`.
- `respondReport(id, response, resolve: boolean)`: response ≥ 5 chars.
- `submitReport(barangay, title, body)`: title ≥ 4, body ≥ 10, barangay must be in the roster.
- `upsertBudgetLine(line)` and `importBudgetCsv(text)`:
  - Accepts `item,office,amount` rows.
  - Rejects non-numeric or negative amounts and reports the bad line numbers.
  - Lines are added, not overwritten.
- `tagCcet(lineId, tag, code?)`.
- `toggleChecklist(id)`.
- `triggerChecklist()`: resets `checklistAck` for every barangay to false, sends the SMS "pre-disaster checklist" to all BDRRMCs, and logs it in the audit.
- `ackChecklist(barangayId)`.
- `dispatchRelief(barangayId, foodPacks, waterKits)`: amounts must not exceed depot stock. It decrements the depot and increments `reliefDelivered`.
- `allocateRcef(barangayId, seedBags)`.
- `broadcastSitrep()`: records the sitrep "up" to PDRRMC, sends the SMS, and returns the message.
- `sendBdrrmcDirective(barangayIds | "all", message)`: SMS "down", with a sitrep record of direction `"down"`.
- `setLccapProgress(id, pct)` and `toggleCdraStep(id)`.
- `toggleClupClimate(id)`.
- `setEmergency(active, level)`.
- `resetMunicipalState()`: available in Settings, with a confirm step.

A `useMunicipalStore()` hook in `src/lib/dashboard/useMunicipalStore.ts` returns `{ state, actions }` with `actor` bound from `useAuth().session?.name`.

## Components (all in `src/components/dashboard/`, one per file, all `"use client"` unless pure)

- `MunicipalCommandView.tsx`: the shell. It renders the following in order:
  1. `MunicipalOverrideBar` (only when `emergencyActive`).
  2. `AppHeader` with `MunicipalHeaderPills` as children.
  3. The layout: `MunicipalSidebar`, then main (`MunicipalTitleBar`, `ModuleNavBar` controlled, active panel).
  4. `HotlineFooter`.
  5. `MunicipalPrintSheet`.

  Props: `{ name?: string }`. It owns `tab` and `printMode` state.
- `MunicipalSidebar.tsx`:
  - Mirrors the ResidentSidebar classes. Shows only the "Municipal Command" role (`t("res.roleMunicipal")`) with the user's name. No other roles.
  - Active Modules: Chat & Comms → m1, Weather & Radar → m2, Emergency Alerts → m3, Evacuation Logistics → m7 (scrolls to `#mun-evac`), Relief & Supplies → m7 (`#mun-relief`), Settings → settings.
  - "Mag-log out" button: `await signOut()`, remove `klimaguard-onboarding`, `router.replace("/signin")`.
  - Telemetry footer: "Santa Cruz MDRRMO", online dot, `BDRRMCs online x/26`, M8/M9 "background active".
- `MunicipalOverrideBar.tsx`: the red bar `CRITICAL OVERRIDE: SEVERE TROPICAL STORM PROTOCOL ACTIVE - SANTA CRUZ MDRRMC LEVEL {n}` (i18n), `role="alert"`, `bg-alert text-white`.
- `MunicipalHeaderPills.tsx`: location pill "Santa Cruz, Laguna", role pill "Role: Municipal Command", and a red "STATUS: ALERT LVL {n}" pill, or a teal "NORMAL" pill when emergency is off. Wraps or hides the role pill under `sm`.
- `MunicipalTitleBar.tsx`: title and subtitle, with the "DANA Executive Report (PDF)" and "TOC Printout" buttons calling `onPrint("dana" | "toc")`, plus a print hint.
- `MunicipalPrintSheet.tsx`: `hidden print:block`. Renders the DANA or TOC sheet from the store with source and timestamp.
- `MunicipalSiteTile.tsx`: a "photo-style" tile with a gradient (`bg-gradient-to-br from-navy to-teal`), a large Icon, a caption overlay and a status chip. No image assets.
- `MunicipalRiverMonitor.tsx`: the OSM iframe (`title`, `loading="lazy"`, `h-64`), the station card, and an "Open in OpenStreetMap" link.
- `MunicipalDirectivePanel.tsx`: the Resolution No. 04 directives from the store, with the "Broadcast Municipal SitRep Update" button. It calls `broadcastSitrep()` and shows an inline success line with time and recipient count.
- `MunicipalDashboardCards.tsx`: the matrix's 9+ dashboard cards:
  - Current weather and rain % (live `useWeather`, with skeleton and Filipino error + retry via `refetch` if available; needs verification on `IUseWeatherResult`).
  - Active alerts count (`useAlerts`, plus the store emergency).
  - Location.
  - DRRM fund status.
  - Compliance scorecard (municipal).
  - Pending deadlines (top 3).
  - Municipal-wide affected population.
  - All-barangay compliance scores (top/bottom 3 with "Tingnan lahat" → m10).
  - Cross-barangay comparison (top 5 risk index bars).
- `MunicipalStatGrid.tsx`: builds `ICommandStat[]` from the selectors and renders the existing `CommandStatCard` for the 9 Stitch stat cards (Affected Households, Evacuation Shelters, LDRRMF, CDRA, Pagsanjan Hydrology, Relief Depo, Flood Infrastructure, Tactical Assets, Inter-Agency Uplink). Wording and badges follow the brief.
- Panels, one per tab:
  - `MunOverviewPanel.tsx`:
    - When emergency is active, it renders first an emergency coordination block: all-barangay evacuation status overview, affected total, a "Mag-trigger ng DRRM checklist" shortcut, and a PDRRMC reporting reminder.
    - Then `MunicipalDashboardCards`, the 3 site tiles, `MunicipalStatGrid`, `MunicipalRiverMonitor`, `MunicipalDirectivePanel`, and the existing `AgencySyncPanel` (fed from `MUN_AGENCIES`, mapped to `IAgencySync`).
  - `MunChatPanel.tsx` (M1): `ChatWidget` plus `SmsBroadcastLog`.
  - `MunWeatherPanel.tsx` (M2):
    - Uses `municipalWeather.ts`: current conditions, a 10-day strip, a 24-hour hourly table (temperature, rain %, mm, wind with direction text), rainfall mm per day as bars, a soil moisture gauge (m³/m³ → %), and the ENSO status.
    - Skeleton while loading, Filipino error + retry. Attribution "Open-Meteo (Asia/Manila)".
  - `MunHazardPanel.tsx` (M3):
    - Signal + typhoon track list + wind speed (from `useAlerts()`, falling back to `MUN_TYPHOON`), "Ligtas ba?" advisory, flood/landslide/storm-surge warnings.
    - Affected barangay list (all 26, filterable by hazard), municipal affected population, consolidated all-barangay alerts.
    - Consolidated disaster reporting (BDRRMC sitreps received + DANA status counts).
    - Population Triage (households per barangay).
    - All-center capacity (read view + link to M7 edit), crop damage risk, livestock advisory, hotlines.
    - Buttons: DRRM checklist trigger and emergency protocol toggle with level select (`setEmergency`).
  - `MunSafetyPanel.tsx` (M4):
    - Accordion of the safety guide sections: signal 1–5, go-bag, routes, health, eye of typhoon, crop protection, livestock evacuation, equipment, community evacuation management, DANA guide.
    - Resident alert broadcast template: an editable textarea prefilled from the signal, a barangay target select (all / one), and "Ipadala" via `smsProvider.send(..., "hazard-alert", "MDRRMO Santa Cruz")` plus an audit entry.
  - `MunAgriculturePanel.tsx` (M5):
    - Crop calendar; pest warnings for all barangays (sortable by risk); crop-climate stress (from the live forecast thresholds, using `derivePestWarnings` / `deriveEnsoWarning` where the signatures fit; needs verification).
    - Municipal crop damage total (feeds DANA) and an ENSO distribution strategy.
    - PCIC enrollment stats (sum, % of farmers, per barangay).
    - DA/RCEF distribution coordination: a form `allocateRcef` with a running allocation table.
    - Livestock municipal-wide; harvest timing (view only, no controls).
  - `MunPlanningPanel.tsx` (M6). Sections with in-panel sub-tabs:
    - CDRA 6-step, consolidating all barangays: step toggle and `x/26` progress.
    - LCCAP 5 sections: progress slider + status.
    - Hazard profile for all barangays, plus a cross-comparison picking two barangays side by side.
    - Municipal projections.
    - Compliance scorecard: municipal indicators and all barangay scores.
    - Deadlines: municipal and all barangay, with 30/15/7 badges.
    - CLUP Integration: zones with the climate-informed toggle.
    - CCET tagging: budget lines with a tag select + code input, and totals per tag.
  - `MunDrrmOpsPanel.tsx` (M7). Sections:
    - Pre-disaster checklist: toggle items, trigger, per-barangay ack grid with an "Ack" button.
    - `#mun-evac` All evacuation centers: number input for occupancy + Save, and an open/standby button.
    - Consolidated DANA: table of 26 with Approve / Return (note) on submitted rows, plus consolidated totals.
    - `#mun-relief` Municipal warehouse + all barangay inventories, and relief distribution per barangay with a dispatch form.
    - Affected population total.
    - SitReps: received from BDRRMCs, sent to PDRRMC, plus the broadcast button.
    - Full LDRRMF 70/30 tracker, reusing `BudgetTracker` via the existing `toTransparencyData` logic (move it into `src/lib/dashboard/municipalSelectors.ts` and export it). `CommandCenterDashboard` then imports it from there.
    - BDRRMC coordination: online status of all 26, plus a directive form to all or selected barangays.
    - `SmsBroadcastLog`.
  - `MunLocationPanel.tsx` (M8): municipality scope card, roster table with coordinates and setting, and the OSM map. Explains that location is barangay-level only.
  - `MunKnowledgePanel.tsx` (M9): knowledge base status (source list from `MUN_KNOWLEDGE_SOURCES`, "Background, auto"), plus quick-question chips that switch to m1.
  - `MunAnalyticsPanel.tsx` (M10):
    - Weather trends (10-day highs/lows bars from `municipalWeather.ts`).
    - All-barangay hazard overlay: barangay × hazard matrix grid plus the OSM map.
    - Cross-barangay risk comparison bars; municipal disaster history.
    - Projections chart (bars).
    - DRRM fund utilization: municipal plus per-barangay bars.
    - Crop damage trend bars.
    - Compliance ranking (all 26, ranked).
  - `MunTransparencyPanel.tsx` (M11):
    - Municipal budget view, plus "Mag-upload ng budget": a single-line form and a CSV textarea import, with validation errors listed.
    - All barangay projects with an edit row: % input + status select + Save, for ANY barangay.
    - Community reports: store reports plus live DB reports (`fetch("/api/reports")` with try/catch; when it fails, show the "Hindi makuha…" note + retry). Respond/resolve form for each, using PATCH for DB ones and the store for seeded ones.
    - "Mag-submit ng report para sa kahit anong barangay" form.
    - Audit log table (WHO/WHEN/WHAT, newest first).
    - Scope note: "Santa Cruz lamang — hindi makikita ang ibang munisipyo."
  - `MunSettingsPanel.tsx`: profile (name, role, department "MDRRMO", Santa Cruz), `ThemeToggle` + `LanguageToggle`, "I-reset ang demo data" with a confirm step, and the "Mag-log out" button (same logic as the sidebar; user request "add a logout on the settings").

## i18n keys (add identical key sets to `en.ts` and `fil.ts`, `mun.` prefix; Filipino in fil)

Insert before the closing `} as const;` (en) and `};` (fil). Minimum set; add more as needed, always in both files.

- Shell:
  - `mun.override` ("CRITICAL OVERRIDE: SEVERE TROPICAL STORM PROTOCOL ACTIVE - SANTA CRUZ MDRRMC LEVEL {level}")
  - `mun.pill.location`, `mun.pill.role`, `mun.pill.status` ("STATUS: ALERT LVL {level}"), `mun.pill.normal`
  - `mun.title`, `mun.subtitle`
  - `mun.btn.danaPdf`, `mun.btn.toc`, `mun.printHint`
- Sidebar:
  - `mun.side.role`, `mun.side.modules`
  - `mun.side.chat`, `mun.side.weather`, `mun.side.alerts`, `mun.side.evac`, `mun.side.relief`, `mun.side.settings`
  - `mun.side.logout` ("Mag-log out")
  - `mun.side.telemetry`, `mun.side.online`, `mun.side.bdrrmcOnline`, `mun.side.background`
- Tabs: `mun.tab.overview`, `mun.tab.m1` … `mun.tab.m11`, `mun.tab.settings`, `mun.tabs.label`
- Actions:
  - `mun.action.save`, `mun.action.approve`, `mun.action.return`, `mun.action.resolve`, `mun.action.respond`, `mun.action.submit`, `mun.action.dispatch`, `mun.action.upload`, `mun.action.import`
  - `mun.action.trigger`, `mun.action.broadcast` ("Broadcast Municipal SitRep Update"), `mun.action.send`, `mun.action.retry`, `mun.action.reset`, `mun.action.confirmReset`, `mun.action.ack`
- Status: `mun.status.ok` ("Na-save."), `mun.status.broadcastSent` ("Naipadala sa {count} na tatanggap · {time}")
- Errors and empty states:
  - `mun.err.weather`, `mun.err.reports`, `mun.err.stock`, `mun.err.invalid`
  - `mun.empty.audit`, `mun.empty.reports`
- Panel headings: `mun.sec.<name>` for every section heading listed in the panels above (e.g. `mun.sec.dana`, `mun.sec.evac`, `mun.sec.relief`, `mun.sec.ccet`, `mun.sec.clup`, `mun.sec.audit`, `mun.sec.river`, `mun.sec.directive`, …).
- Settings: `mun.settings.profile`, `mun.settings.department`, `mun.scopeNote`, `mun.source`

Data-content strings (barangay notes, directive text, guide steps) stay in `dashboardData.ts` in Filipino/Taglish, matching the existing convention there.

## Icons to add (`src/components/common/Icon.tsx`, additive)

Confirmed absent today. Re-check before adding, since `log-out` was duplicated before:

- `settings`, `printer`, `file-text`, `clipboard-check`, `truck`, `gauge`, `wind`, `calendar`, `pencil`, `upload`, `tag`, `history`

For each, add one union member (before `| "sprout";`) and one `PATHS` entry, using simple 24×24 stroke paths in the existing style.

---

# Implementation Plan

- [ ] 1. Add the shared additive pieces: the `IMun…` types (Data model § Types) appended to `src/types/index.ts`; the 12 icons in `Icon.tsx`; the `mun.*` keys in both `en.ts` and `fil.ts`. Re-read each file first and use only small anchored `str_replace` insertions.
      Files: src/types/index.ts, src/components/common/Icon.tsx, src/lib/i18n/en.ts, src/lib/i18n/fil.ts
      Verify: `npx tsc --noEmit` passes with 0 errors. Because `fil` is typed `Record<ITranslationKey, string>`, a key missing from fil fails here. `npx eslint src/types/index.ts src/components/common/Icon.tsx src/lib/i18n` is clean.

- [ ] 2. Build the municipal data layer:
      - Extend `dashboardData.ts` with `MUN_LOCATION`, `MUN_SOURCE`, `MUN_OSM_EMBED`, `buildSeed()` / `MUN_SEED_STATE` and all static `MUN_*` exports. Update the LDRRMF constants to 45.2M / 28.1M.
      - Create `municipalSelectors.ts`, with `toTransparencyData` moved there and `CommandCenterDashboard.tsx` updated to import it, and `municipalFormat.ts`.
      - Satisfy the invariants:
        - Affected households sum to 1,420.
        - The 26 barangays include San Roque.
        - San Roque has 1,240 at-risk residents in Purok 3 & 4; San Roque Central Gym is at 300/400; San Roque Elem. is on standby at 250; San Roque reports are 2 resolved / 0 pending; the San Roque Seawall project is at 85%.
        - Centers total 812/1,200 with 4 of 6 open.
        - The fund is 62% with QRF ₱13.56M and mitigation ₱31.64M.
      - Add a dev-only invariant function `assertMunSeedInvariants()` that returns a list of violated invariants (no console). It is used in item 9's check.
      Files: src/lib/dashboard/dashboardData.ts, src/lib/dashboard/municipalSelectors.ts, src/lib/dashboard/municipalFormat.ts, src/components/dashboard/CommandCenterDashboard.tsx
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/lib/dashboard src/components/dashboard` is clean. Then run `npx tsx -e "import('./src/lib/dashboard/dashboardData.ts').then(m=>console.log(JSON.stringify(m.assertMunSeedInvariants())))"` and expect `[]`. If `tsx` is unavailable offline, skip it and note it for the reviewer. Do NOT install it into package.json.

- [ ] 3. Create the store and the hook:
      - `municipalStore.ts`: seed, lazy localStorage load/persist in try/catch, subscribe/getSnapshot/getServerSnapshot, all actions from "Store actions" as pure reducers plus dispatchers with the audit append and `{ok,error}` results. SMS-sending actions call `smsProvider.send` from `@/lib/sms`.
      - `municipalWeather.ts`: the Open-Meteo 10-day/hourly/soil fetcher, with the 15-minute cache and the Filipino error.
      - `useMunicipalStore.ts` and `useMunicipalWeather.ts`, each returning `{ data, isLoading, error, retry }`.
      Depends on 1–2.
      Files: src/lib/dashboard/municipalStore.ts, src/lib/dashboard/municipalWeather.ts, src/lib/dashboard/useMunicipalStore.ts, src/lib/dashboard/useMunicipalWeather.ts
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/lib/dashboard` is clean, including the react-hooks rules.

- [ ] 4. Build the shell:
      - `MunicipalCommandView`, `MunicipalSidebar` (single role, logout), `MunicipalOverrideBar`, `MunicipalHeaderPills`, `MunicipalTitleBar`, `MunicipalPrintSheet` (DANA + TOC via `window.print()` / `afterprint`) and `MunSettingsPanel` (logout, toggles, reset).
      - Add the controlled `activeId` prop to `ModuleNavBar`, with backward-compatible defaults and the 12 tabs + settings.
      - Light by default: no `cmd-dark`, root `bg-surface-2`.
      - Export the new components and props from `src/components/dashboard/index.ts`.
      - Until item 5–8 panels exist, render a temporary panel for not-yet-built tabs, but every tab must be real by item 8.
      Depends on 3.
      Files: src/components/dashboard/{MunicipalCommandView,MunicipalSidebar,MunicipalOverrideBar,MunicipalHeaderPills,MunicipalTitleBar,MunicipalPrintSheet,MunSettingsPanel,ModuleNavBar}.tsx, src/components/dashboard/index.ts
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/components/dashboard` is clean.

- [ ] 5. Wire `page.tsx`. Re-read it immediately before editing, because the barangay workflow is editing it. Make three targeted `str_replace`s and touch nothing in the role precedence or `?role=` guard:
      - (a) Change the import `CommandCenterDashboard` → `MunicipalCommandView`.
      - (b) Change `return <CommandCenterView />;` → `return <MunicipalCommandView name={session.name} />;`.
      - (c) Delete the local `function CommandCenterView() {…}` block and remove only those imports (`useLocation`, `useWeather`, `getMunicipalDashboardData`, `describeWeather`) that nothing else in the file still uses.
      If the lgu branch text has changed shape, adapt the minimal replacement to the new text without touching surrounding logic.
      Files: src/app/dashboard/page.tsx
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/app/dashboard/page.tsx` is clean. `git diff src/app/dashboard/page.tsx` shows only those hunks plus whatever the other workflow changed.

- [ ] 6. Build the Overview and its pieces: `MunOverviewPanel` (emergency coordination block first when active), `MunicipalDashboardCards`, `MunicipalStatGrid` (9 Stitch stat cards from the selectors via `CommandStatCard`), `MunicipalSiteTile` (3 tiles), `MunicipalRiverMonitor` (OSM iframe + Bagumbayan Bridge station) and `MunicipalDirectivePanel` (SitRep broadcast). Reuse `AgencySyncPanel`.
      Files: src/components/dashboard/{MunOverviewPanel,MunicipalDashboardCards,MunicipalStatGrid,MunicipalSiteTile,MunicipalRiverMonitor,MunicipalDirectivePanel}.tsx, index.ts
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/components/dashboard` is clean.

- [ ] 7. Build the communication, weather, hazard, safety and agriculture panels: `MunChatPanel` (M1), `MunWeatherPanel` (M2, full 10-day/hourly/mm/soil/wind/ENSO), `MunHazardPanel` (M3, all 15 municipal alert features incl. checklist trigger + emergency toggle), `MunSafetyPanel` (M4 guide + broadcast template) and `MunAgriculturePanel` (M5, 13 features incl. RCEF allocation, PCIC stats, municipal crop damage). Wire them into the view's tab switch.
      Files: src/components/dashboard/{MunChatPanel,MunWeatherPanel,MunHazardPanel,MunSafetyPanel,MunAgriculturePanel,MunicipalCommandView}.tsx, index.ts
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/components/dashboard` is clean.

- [ ] 8. Build the governance panels: `MunPlanningPanel` (M6, all 8 incl. CLUP + CCET tagging), `MunDrrmOpsPanel` (M7, all 9: checklist + ack, evac occupancy edit, DANA approve/return, warehouse + inventories, relief dispatch, sitreps up/down, LDRRMF 70/30 via `BudgetTracker`, BDRRMC directives, SMS log), `MunLocationPanel` (M8), `MunKnowledgePanel` (M9), `MunAnalyticsPanel` (M10, all 8) and `MunTransparencyPanel` (M11: budget upload/CSV, edit any project, reports store + live DB with PATCH, submit for any barangay, audit log, scope note). Remove the temporary panel from item 4 so every tab renders a real panel.
      Files: src/components/dashboard/{MunPlanningPanel,MunDrrmOpsPanel,MunLocationPanel,MunKnowledgePanel,MunAnalyticsPanel,MunTransparencyPanel,MunicipalCommandView}.tsx, index.ts
      Verify: `npx tsc --noEmit` has 0 errors and `npx eslint src/components/dashboard src/lib/dashboard` is clean.

- [ ] 9. Run integration verification and the docs update:
      - `npm run lint` and `npm run build` must succeed. Fix only owned files. Report shared-file conflicts instead of overwriting.
      - Re-run the item 2 invariant check.
      - Manual smoke, if a dev server is already running (do not start a blocking one): sign in as the seeded lgu user, open `/dashboard`, and confirm:
        - Light theme by default; the toggle flips to dark; the red bar is legible in both.
        - The sidebar shows only Municipal Command plus the name. Logout works from the sidebar and from Settings.
        - Every tab renders.
        - Changing San Roque Central Gym occupancy updates the Overview shelter card.
        - Approving the San Roque DANA updates the consolidated totals.
        - SitRep broadcast appears in the SMS log.
        - A project edit, a report resolve, a budget CSV import and a CCET tag each add an audit row and survive a reload (localStorage).
        - The DANA PDF / TOC open the print dialog with the sheet.
      - Append a short "Municipal Official dashboard" section to README.md (additive `str_replace` at the end).
      Files: README.md (additive), any owned file needing fixes
      Verify: `npm run lint` passes and `npm run build` completes with "Compiled successfully" and the `/dashboard` route listed.

## Needs verification during implementation (do not assume)

- The `IUseWeatherResult` fields (is there `refetch`?) and the `useAlerts()` typhoon data shape. Fall back to `MUN_TYPHOON` when `hasActiveHazard` is false.
- `derivePestWarnings` / `deriveEnsoWarning` signatures in `src/lib/agriculture/advisory.ts`, before reusing them.
- `ChatWidget` behavior inside a tab: it posts to `/api/chat` and must work for an lgu session.
- Whether `/api/reports` returns 200 for the seeded lgu user (DB present at `prisma/dev.db`), and that PATCH responding works end to end.
- The `useAuth().signOut` signature returns `Promise<void>`, so await it before `router.replace`.
- Whether `Icon.tsx` already gained any of the 12 names from the other workflow before you add them.
- Whether `page.tsx` changed shape (barangay branch added) before the item 5 edits.

## Known gaps / assumptions

- Municipal ops data, edits and the audit log are client-side (localStorage) and demo-grade. They are not shared across devices. No API/prisma changes, per the ownership rules.
- "Submit report for any barangay" is store-only, because `POST /api/reports` rejects `lgu` and that route is not ours to change.
- San Roque replaces Santo Angel Central to keep 26 barangays. Beds remaining shows the derived 388, not the mock's inconsistent 380.
- PDF output is via the browser print dialog ("Save as PDF"). No PDF library is added.
