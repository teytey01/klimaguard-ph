# Barangay Official dashboard for KlimaGuard PH

This change adds a dedicated Barangay Official dashboard. It lives in a new `barangay` domain (`src/components/barangay/*`, `src/lib/barangay/*`, `src/lib/api/barangayWeather.ts`) and is wired into `/dashboard` for sessions whose role is `barangay`. The design follows the Stitch "Barangay San Roque, Santa Cruz" screen: a six-tab bar (Operations Grid, Evacuation, Tanod, River, Relief, Incident Reports) plus sidebar modules for M1, M2, M3/M7, M4, M5, M6, M10, M11 and an audit log. All operational state lives in one React context. Every mutation goes through a pure, unit-tested function in `barangayOps.ts` and records a WHO/WHEN/WHAT audit entry. The role comes only from the server session. No new auth was built: the existing official username/password login is used, with one extra seeded account (`brgy.sanroque`).

Watch for: the incident counts on the Operations Grid and Reports tab only cover the in-memory demo log, not the DB-backed community reports residents actually file (confirmed). M10 has no hazard map and M5 has no livestock-owner alert, though the matrix lists both for this role (confirmed; the plan's scope reduction allowed it). The emergency strip always says "SEVERE TROPICAL STORM PROTOCOL", whatever the hazard type (confirmed). None of these block the gate.

**Verdict**: APPROVED

## High-level view

Role routing is now server-authoritative. `DashboardPage` reads `session.role` from `useAuth()` (backed by `/api/auth/me`) and never reads `?role=` at all. A barangay user can't reach `MunicipalCommandView` by editing the URL. The `lgu`, resident and farmer branches are unchanged, and onboarding still gates only resident/farmer. The query string is ignored rather than stripped, which the task's "ignores/redirects" allows.

`BarangaySidebar` is a sibling of `ResidentSidebar`, not a generalization of it. It shows `ROLE_NAV.filter(r => r.role === "barangay")` only, plus the same `res.logout` ("Mag-log out") flow: signOut, clear `klimaguard-onboarding`, then `/signin`. `ResidentSidebar` was not touched and still filters to the session role.

Matrix scope holds. M6 has a note and no CLUP/CCET tools. M10 says it has no cross-barangay ranking and no crop-loss analytics. M7 has no BDRRMC coordination and no consolidated DANA. M11 loads the municipal budget view-only from `/api/db/transparency`, which is scoped to the session's municipality on the server. There is no upload control. Own-barangay projects are editable through `setProjectProgress`, which refuses `editable: false` rows. The other barangay's project is view-only. DB community reports use the resident `ReportsTab` with `canSubmit={false}`. Respond/resolve scope for those is enforced server-side by `canRespond`.

Every view renders a working panel, and none is a stub:
- Dispatch dialog
- Evacuation occupancy edit and open/standby toggle
- Tanod status/dispatch
- River manual reading with alert/critical red override
- Relief inventory edit and distribution with stock deduction
- Incident add/respond/resolve with live counts
- Checklist, auto-activated on signal ≥2
- DANA with the 3-hour countdown, SitRep and copy
- QRF with the over-limit error
- Affected population
- M4 SMS broadcast
- M5 crop damage feeding DANA
- M6 CDRA advance
- M10 live rain trend
- M11 project edit
- M1 chat
- M2 hourly + 7-day weather

The remaining gaps are fidelity gaps inside these panels, not missing panels.

On code rules: a grep of the barangay domain finds no `any`, no inline `style=`, and no `console.log`. The fetching panels (transparency, both weather surfaces, analytics) show animate-pulse skeletons and a Filipino error with a retry button. `fetchBarangayHourly` passes `timezone=Asia/Manila`, caches for 15 minutes, and serves stale data on failure. Every card carries a source line. The coder's recorded evidence is lint 0, tsc 0, `npm test` 15/15 and one `npm run build` exit 0 (`.agents/tasks/barangay-verification.md`). Because `fil.ts` is `Record<ITranslationKey,string>`, that tsc pass also proves en/fil key parity. `AGENTS.md` shows no diff. `.env.local` is gitignored, so it can't be checked through git.

<details>
<summary>Issues (5)</summary>

1. **Incident counts ignore DB community reports** (non-blocking): `reportCounts(state.reports)` only counts the in-memory BDRRMC log, so a report a resident files via `/api/reports` never moves the "2 resolved / 0 pending" figure. Fold the `ReportsTab` data into the counts, or label the card as the walk-in/hotline log only.
2. **M10 hazard map missing** (non-blocking): the matrix lists "Hazard maps: their barangay", and the plan called for an OSM embed via `osmEmbedUrl`. `BarangayAnalyticsPanel` renders no map. Add the embed, or a static flood-map row with attribution.
3. **M5 livestock-owner alert missing** (non-blocking): the matrix grants "Alert livestock owners", but `AgricultureAreaPanel`/`AGRI_ROWS` has no livestock row or broadcast action. Add one row plus an SMS-demo action like M4's.
4. **Emergency strip text is hazard-agnostic** (non-blocking): `brgy.emergencyStrip` always reads "SEVERE TROPICAL STORM PROTOCOL", even for flood or landslide alerts. Interpolate the alert type or typhoon name.
5. **Broadcast has no visible log** (non-blocking): `SafetyCommunityPanel` sends through `smsProvider` but doesn't render `<SmsBroadcastLog />`, as the plan specified. The only feedback is a status line and an audit entry. Render the log under the form.

</details>

<details>
<summary>Details</summary>

### Session-only role resolution in `/dashboard`

```
/api/auth/me ──► AuthProvider.session.role
                      │
DashboardPage ────────┤  (no useSearchParams, no localStorage role)
   lgu       → MunicipalCommandView
   barangay  → BarangayDashboard(barangay/municipality/province from session.location)
   otherwise → ResidentDashboard(role)   // resident + farmer
```

The plan originally made onboarding write the role into the session. The implementer dropped that idea correctly: `PATCH /api/auth/profile` refuses to self-grant official roles, and weakening that guard would be an access-control regression. Officials sign in with the seeded username/password accounts instead. The barangay branch falls back to "San Roque" / "Santa Cruz" / "Laguna" when `session.location` fields are empty, which would show San Roque's demo title on a malformed official account. No server-scoped data is affected.

### Two parallel incident systems in the Reports tab

`IncidentReportsPanel` stacks two lists. The first is the BDRRMC incident log: in-memory `state.reports` with add, respond and resolve, which feeds the tab badge and the Operations Grid card. The second is the DB-backed `ReportsTab` for M11 community reports. The live counts come only from the first list. The Stitch figures (2 resolved / 0 pending) are reproduced, but a real resident report shows up only in the lower list and never changes the headline count (confirmed). The respond/resolve requirement is met by both lists. The accuracy issue is limited to the counts.

### Matrix fidelity inside the compact M5/M10 panels

The scope reduction limits M5/M10 to 2–4 rows, and both panels honour that. Two Barangay-column items were dropped without a placeholder: the M10 "Hazard maps (their barangay)" entry and the M5 "Livestock protection advisory → Alert livestock owners" entry (confirmed). M10 climate projections appear only as an M6 row, which is close enough. Neither panel exposes a municipal-only feature, so this is incomplete coverage, not an access violation.

### Emergency override styling

Alert red appears only on emergency/critical states:
- the header strip and status pill while `useAlerts` reports an active hazard
- river alert/critical
- an evac center at full
- an overdue DANA
- heat index ≥42°C
- flood crop stress
- the red broadcast button during alerts

A raised signal ≥2 auto-activates the checklist once, and that is audited. The strip copy is fixed to the tropical-storm wording (confirmed). An NDRRMC flood or landslide alert would still announce a storm protocol.

### Test coverage

`tests/barangay/barangayOps.test.mjs` exercises the pure layer (15 cases): evac thresholds, dispatch/responder count, river thresholds and trend, report counts through add → respond → resolve, distribution stock deduction and rejection, DANA countdown/overdue/validation, SitRep contents, QRF over-limit, own-project-only edits, crop damage → DANA, audit ordering, and widthClass.

Not tested: `DashboardPage` role branching (no component test harness exists), `fetchBarangayHourly` parsing and stale fallback, and the provider's audit wiring. A browser pass (login → dashboard, 375 px, dark/EN) was deferred to the verify step per the verification note.

</details>

<details>
<summary>Files changed (barangay scope)</summary>

- `src/app/dashboard/page.tsx`: session-only role resolution; adds the `barangay` branch.
- `src/components/barangay/BarangayDashboard.tsx`, `BarangayWorkspace.tsx`: provider wrapper; tab bar, view switch, dispatch dialog host, checklist auto-activation.
- `src/components/barangay/BarangayOpsProvider.tsx`: context + `useState` state; audited `update`; `reset`.
- `src/components/barangay/BarangaySidebar.tsx`: own role only, modules, log out.
- `src/components/barangay/BarangayCommandHeader.tsx`, `DispatchTanodDialog.tsx`: header pills/strip; dispatch modal.
- `src/components/barangay/OperationsGridPanel.tsx`, `EvacuationCentersPanel.tsx`, `BarangayEvacCenterCard.tsx`, `TanodPatrolsPanel.tsx`, `RiverSensorsPanel.tsx`, `ReliefGoodsPanel.tsx`, `IncidentReportsPanel.tsx`, `BarangayIncidentItem.tsx`: the six design tabs.
- `src/components/barangay/DrrmOpsView.tsx`, `PreDisasterChecklistPanel.tsx`, `DanaFormPanel.tsx`, `QrfTrackerPanel.tsx`, `AffectedPopulationPanel.tsx`, `BarangayPopulationRow.tsx`: M3/M7.
- `src/components/barangay/SafetyCommunityPanel.tsx`, `AgricultureAreaPanel.tsx`, `BarangayPlanningPanel.tsx`, `BarangayAnalyticsPanel.tsx`, `BarangayTransparencyPanel.tsx`, `BarangayProjectEditor.tsx`, `BarangayWeatherPanel.tsx`, `BarangayChatPanel.tsx`, `AuditLogPanel.tsx`: modules M4/M5/M6/M10/M11/M2/M1 and the audit log.
- `src/components/barangay/BarangayCard.tsx`, `BarangayInfoRows.tsx`, `index.ts`: shared card, row list, barrel.
- `src/lib/barangay/barangayOps.ts`, `barangayData.ts`, `index.ts`: pure ops logic; demo data + tab/module config.
- `src/lib/api/barangayWeather.ts`: hourly Open-Meteo client with 15-minute cache.
- `src/lib/i18n/en.ts`, `fil.ts`, `src/types/index.ts`: `brgy.*` keys and `IBarangay*` types (additive).
- `prisma/seed.mjs`: seeded `brgy.sanroque` official.
- `package.json`, `tests/barangay/barangayOps.test.mjs`: `npm test` script and the unit tests.

Full diff: `git status` / `git diff main` in the workspace (most files are untracked, so they don't appear in `git diff`).

</details>
