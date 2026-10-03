# MDRRMO Municipal Command Center for the `lgu` role (Santa Cruz, Laguna)

The change swaps the forced-dark `CommandCenterView` in the `lgu` branch of `/dashboard` for `MunicipalCommandView`. It is a theme-token shell: a red override bar, header pills, a single-role sidebar, a title bar with two print actions, a 12-tab module bar (Overview, M1–M11), a Settings view, and a print-only sheet. Every write goes through a new in-memory client store (`municipalStore.ts`, read with `useSyncExternalStore`). Each store action validates its input, returns a Filipino error key on bad input, and appends a WHO/WHEN/WHAT audit entry. SitRep, checklist, directive, DANA-form and resident-alert broadcasts all go through the existing `smsProvider`, so they show up in `SmsBroadcastLog`. M2 calls Open-Meteo directly (10-day, hourly, soil moisture, `timezone=Asia/Manila`, 15-minute cache). The other panels derive their numbers from pure selectors, so editing occupancy, DANA or projects recomputes every card. The orchestrator's scope reduction applies: the seed lists 5 barangays while headline copy says 26, edits live in memory only, and each panel is compact.

Watch for:
- San Roque's DANA, affected-family and crop-damage figures disagree with the barangay dashboard (confirmed). The five figures the brief required do match.
- The budget panel can add lines but cannot edit an existing line's item or amount. Two store actions (CSV import, LCCAP progress) are never wired to the UI (confirmed).
- Alert red is used on non-emergency controls such as Log out and Reset (confirmed).
- The seeded `lgu` user is `mdrrmo.calamba`, but the view hard-codes Santa Cruz (confirmed). The plan made this trade-off deliberately.

None of these is a HIGH issue under the orchestrator's gate: no broken feature, no access-matrix violation, no failed build, no `any`, inline style or `console.log`.

**Verdict**: APPROVED

## High-level view

`MunicipalCommandView` owns the active tab and print mode. Sidebar and tab bar share one `navigate(tab, anchor)` function, so "Evacuation Logistics" and "Relief & Supplies" switch to M7 and scroll to `#mun-evac` and `#mun-relief`. The sidebar lists exactly one role, "Municipal Command", with the signed-in name under it. Its "Mag-log out" calls `signOut()`, clears the onboarding draft and redirects to `/signin`. Settings has the same logout, plus theme and language toggles and a confirmed demo reset. `page.tsx` changes only the `lgu` return. The role-from-session rule and the resident onboarding redirect are untouched.

Matrix coverage is complete at compact depth:
- M3 has signal/track, "Ligtas ba?", hazard counts, a filterable affected list, consolidated DANA/SitRep counts, triage, all centers, crop and livestock risk, and protocol on/off plus checklist trigger.
- M4 has the guide accordion and a resident-alert broadcast.
- M5 has municipal-wide pests, crop damage, ENSO strategy, PCIC and RCEF allocation.
- M6 has CDRA, LCCAP, scorecard, deadlines, projections, a CLUP toggle and CCET tagging.
- M7 has the checklist with BDRRMC acks, evac occupancy edit and open/standby, DANA approve/return, relief dispatch, SitReps up/down, the LDRRMF 70/30 `BudgetTracker`, BDRRMC directives and the SMS log.
- M10 has trends, a hazard matrix, risk, fund utilization, compliance ranking and crop-damage trend.
- M11 has budget upload, project edit for any barangay, respond/resolve/submit reports, and the audit log.

M8 and M9 get small status panels. When emergency mode is on, the Overview renders `MunEmergencyPanel` first.

The store follows the existing `src/lib/sms` pattern, and its server snapshot is the same seed object, so hydration is safe. Validation sits in the reducers: occupancy is clamped to capacity, DANA review is allowed only from `submitted` and a return needs a note, relief cannot exceed depot stock, and CSV rows are validated per line. The weak spots are coverage gaps rather than broken paths: a few write paths exist only in the store, and the San Roque seed disagrees with the barangay seed on fields outside the agreed five.

Theme: no `cmd-dark`, `bg-[#0f1b2d]` or raw hex remains in the municipal files. Everything uses the `--cmd-*` tokens, which `globals.css` flips under `.dark`, so the header `ThemeToggle` drives the whole view and light is the default. Emergency surfaces use `bg-alert text-white` in both themes. Two contrast and token concerns are left: teal small text on white, and red on non-emergency buttons.

Shared-file edits are additive:
- `en.ts`/`fil.ts` spread `munEn`/`munFil` at the top, and `munFil: Record<IMunTranslationKey, string>` enforces key parity at compile time.
- The tracked-file diffs for types and the barrels remove no municipal-era lines. The one removed doc-comment in `types/index.ts` belongs to the earlier M1 workflow.

Verification evidence covers tsc, lint and one build, all exit 0. Browser checks were explicitly deferred to the verify step.

<details>
<summary>Issues (9)</summary>

1. **San Roque DANA and crop-damage mismatch with the barangay dashboard (confirmed)**:
   - **The mismatch:** the municipal seed shows San Roque DANA as `submitted` with 520 families, 18 houses, ₱1.85M agri and ₱2.4M infra damage. Its BDRRMC SitRep says "DANA naipadala". The barangay seed has DANA unsubmitted (`submittedAt: null`) with 260 families (142 + 118 in Purok 3 & 4), 0 houses and ₱185,000 crop damage. ₱1.85M vs ₱185k looks like a 10× typo.
   - **Fix:** align San Roque's `affectedHouseholds`/`cropDamagePhp`/DANA record with `barangayData.ts`, then rebalance another barangay so the 1,420 total still holds. Alternatively, change both seeds to the same agreed values.
2. **Existing budget lines are add-only (confirmed)**: M11's form calls `upsertBudgetLine` without an `id`, so a line's item, office or amount cannot be edited after upload. CCET tag/code is the only edit. Add an edit affordance per row (the store already supports `id`), or note the limitation.
3. **Unwired store actions (confirmed)**: `importBudgetCsv` (with per-line validation) and `setLccapProgress` are bound in `useMunicipalStore` but no component calls them. LCCAP sections are read-only bars. Wire a CSV textarea in M11 and a progress input in M6, or remove the dead actions.
4. **Alert red on non-emergency controls (confirmed)**: `MUN_BTN_ALERT` is used for Settings "Mag-log out" and "I-reset", and `MUN_TONE_CHIP.critical` (solid red) for "returned" DANA and deadline badges. This conflicts with the steering rule that Alert Red is for emergencies only. Use outline/neutral styles outside emergency surfaces.
5. **Teal small text contrast on light surfaces (likely)**: `text-teal` (#38B2AC) on white/`cmd-tile` is about 2.5:1. It is used for `MUN_BTN_OUTLINE` labels, `MunFeedback` success lines (text-xs) and several stat values. This fails WCAG AA for small text in light mode. Use a darker teal token for text, or pair teal with a filled background.
6. **Session municipality ignored (confirmed, deliberate)**: `MunicipalCommandView` hard-codes Santa Cruz. The seeded `lgu` user is `mdrrmo.calamba`, so that account sees another municipality's command center. At minimum, show the scope label from `session.location.municipality`, or make the demo `lgu` account a Santa Cruz user once `prisma/` is in scope.
7. **Recipient counts vs "26 barangays" copy (confirmed)**: SitRep/checklist/directive broadcasts go to the 5 seeded BDRRMCs (plus PDRRMC), so the success line says "6 recipients". The SitRep text and headline copy say "26 brgy". Either label the list as featured barangays, or phrase the message as "5 sa 26".
8. **M10 / M5 weather error has no retry (confirmed)**: in M10 and M5 a failed `useMunicipalWeather` shows only the error text, and loading shows text rather than a skeleton. The steering requires error + retry and skeleton loaders. Pass `weather.retry` to a retry button there.
9. **Print mode never resets (confirmed)**: the planned `afterprint` reset is missing, so a later Ctrl+P re-prints the last DANA/TOC sheet. Add a `window` `afterprint` listener that sets `printMode` back to `"none"`.

</details>

<details>
<summary>Details</summary>

### San Roque cross-dashboard figures

The five figures the brief pinned all match `barangayData.ts`, and `assertMunSeedInvariants()` encodes them:
- Central Gym 300/400.
- Elementary school on standby with capacity 250.
- 1,240 at risk in Purok 3 & 4.
- Two resolved reports and zero pending.
- Seawall at 85%.

The divergence is in fields next to those:

```
                      barangay dashboard        municipal dashboard
DANA status           not submitted (null)      submitted (iso(40))
affected families     260                       520 (affectedHouseholds + DANA)
houses damaged        0                         18
agri / crop damage    ₱185,000                  ₱1,850,000
```

The municipal SitRep "sit-1" from BDRRMC San Roque claims "DANA naipadala", which contradicts the barangay view. Both stores are in memory and independent. An approve or return in M7 never reaches the barangay dashboard, and a barangay submission never reaches M7. That is expected under the scope reduction, but it makes the seed alignment more important, because a demo walkthrough shows both screens side by side. San Roque's 520 households is part of the 1,420 total. Correcting it to 260 means moving 260 households to another featured barangay (Pagsawitan or Santo Angel Norte) to keep the headline.

### Budget write paths in M11 and M6

`upsertBudgetLine` supports an `id` for edit-in-place, but `MunTransparencyPanel` always submits without one. Uploaded lines therefore cannot be corrected, and a typo in an amount stays until reset. `importBudgetCsv` has the plan's full validation (header row, `₱` stripping, bad-line reporting, append-only) but no UI entry point. M6 CCET tagging works through a select per line. Choosing a tag with no existing code defaults `ccetCode` to the literal `"CC-TAG"`, and there is no code input to change it. This is a reasonable placeholder, but it shows in the line label. LCCAP has a `setLccapProgress` reducer with status derivation (100 → adopted, ≥75 → review), but the panel renders read-only bars.

### Theme and red usage

The forced dark is gone, and every surface uses `bg-cmd-surface` / `bg-cmd-tile` / `text-cmd-heading` / `text-cmd-muted`. The emergency override bar, header status pill, hotline block and emergency panel header are `bg-alert text-white`, which is legible in both themes.

Red also appears on controls that are not emergencies:
- Settings logout and reset use `MUN_BTN_ALERT`.
- The "returned" DANA chip, overdue/7-day deadline chips, risk-index chips ≥7, the "bottom" compliance header and the hazard-matrix dots use solid or text red.

Some of these are risk signals and defensible. Logout and Reset are not. `BTN_ON_RED` in `MunEmergencyPanel` (`text-alert` text-xs on white) is about 4:1, slightly under AA for small text.

### Scope and identity

The plan chose Santa Cruz to match Stitch and the barangay dashboard (San Roque, Santa Cruz). The data file avoids any other municipality, and M11 shows the "Santa Cruz lamang" note. The view never reads `session.location.municipality`, though. With the current seed, the only `lgu` login is `mdrrmo.calamba`, and it lands on a Santa Cruz command center. Audit entries attribute Santa Cruz actions to that account. This is not a data leak, because all data is demo and client-only. It is the kind of cross-municipality presentation the matrix §14 rule is meant to prevent, so it should at least be visible in the UI.

### Print path

All app chrome is `print:hidden`. The plan's `afterprint` reset was not implemented, so `printMode` stays on the last sheet and a later Ctrl+P prints that sheet again.

### Test coverage

Covered: tsc, ESLint and one `next build`, all exit 0, per `municipal-verification.md`.

Not tested:
- No runtime execution of `assertMunSeedInvariants()`.
- No browser pass yet (deferred to the verify step): print dialog, 375px layout, dark/EN spot check.
- No unit tests for the reducers. Their validation logic (occupancy clamp, DANA state machine, CSV parsing, depot stock) is the main correctness surface and is pure, so it is easy to test once a runner exists.

</details>

<details>
<summary>File map</summary>

- `src/app/dashboard/page.tsx`: `lgu` branch renders `MunicipalCommandView`; the local `CommandCenterView` is removed.
- `src/components/dashboard/MunicipalCommandView.tsx`: shell, tab and print state, panel switch.
- `src/components/dashboard/MunicipalSidebar.tsx`: single-role sidebar, module shortcuts, logout, telemetry.
- `MunicipalOverrideBar`, `MunicipalHeaderPills`, `MunicipalTitleBar`, `MunicipalPrintSheet`: emergency bar, pills, print buttons, DANA/TOC print sheet.
- `MunicipalDashboardCards`, `MunicipalStatGrid`, `MunicipalSiteTile`, `MunicipalRiverMonitor`, `MunicipalDirectivePanel`: Overview content.
- `Mun{Emergency,Overview,Chat,Weather,Hazard,Safety,Agriculture,Planning,DrrmOps,Location,Knowledge,Analytics,Transparency,Settings}Panel.tsx`: one panel per tab.
- `MunSection`, `MunBar`, `MunFeedback`: section frame, width-class progress bar, action result line.
- `ModuleNavBar.tsx`: optional controlled `activeId`/`hideIds`/`ariaLabel` (backward compatible).
- `CommandCenterDashboard.tsx`: imports `toTransparencyData` from selectors.
- `src/lib/dashboard/municipalStore.ts`: store, reducers, audit log, SMS sends.
- `useMunicipalStore.ts`, `useMunicipalWeather.ts`, `useMunicipalLogout.ts`: hooks.
- `municipalSelectors.ts`, `municipalFormat.ts`, `municipalWeather.ts`, `munUi.ts`: selectors, formatting, Open-Meteo fetcher, class strings.
- `dashboardData.ts`: municipal seed and statics; LDRRMF set to ₱45.2M/₱28.1M.
- `src/lib/i18n/munEn.ts`, `munFil.ts`: `mun.*` keys; `en.ts`/`fil.ts` spread them.
- `src/types/index.ts`: `IMun*` block (additive).
- `src/components/common/Icon.tsx`: 4 icons added.
- `README.md`: municipal section appended.

Full diff: most files are untracked, so use `git status` plus a direct read of the paths above. `git diff` covers only the tracked shared files.

</details>
