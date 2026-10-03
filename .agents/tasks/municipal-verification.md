# Municipal Official (lgu) — verification evidence (iteration 1)

This was the first iteration (`municipal-review.json` did not exist). It was implemented under the orchestrator SCOPE REDUCTION, which is now recorded at the top of `municipal-plan.md`. Nothing was committed.

## Commands run (cwd = workspace root)

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0, no errors |
| `npm run lint` (eslint) | exit 0, no errors or warnings printed |
| `npm run build` (run once) | exit 0. Output: "✓ Compiled successfully in 7.4s", TypeScript finished, 25/25 static pages, `/dashboard` listed as ○ static |

Concurrency notes:
- Before the build, a `next dev` server not started by me was running: PIDs 22616, 23780 and 24952, started at 05:16 and 05:24.
- I waited about 90 s and re-checked. It was still running because it is long-lived.
- Next 16 dev writes to `.next/dev`, separate from the build output, and `.next/` already held a previous build next to `dev/`. So I ran the single build, and it succeeded. I killed no processes.
- An earlier tsc run showed one error in the barangay workflow's in-progress `src/components/barangay/IncidentReportsPanel.tsx` (missing module). I did not touch it, and it cleared on later runs.

## Not run / skipped
- No dev server and no browser checks, per the orchestrator SPEED note. The verify step handles those.
- `assertMunSeedInvariants()` in `dashboardData.ts` was not executed. `tsx` is not installed and I added no dependency. By inspection the seed sums to 1,420 households (520+380+260+180+80), 812/1,200 occupancy, 4/6 centers open, and 62% LDRRMF.

## Files
- Owned, new: `src/components/dashboard/{MunicipalCommandView, MunicipalSidebar, MunicipalOverrideBar, MunicipalHeaderPills, MunicipalTitleBar, MunicipalPrintSheet, MunicipalSiteTile, MunicipalRiverMonitor, MunicipalDirectivePanel, MunicipalStatGrid, MunicipalDashboardCards, MunEmergencyPanel, MunOverviewPanel, MunChatPanel, MunWeatherPanel, MunHazardPanel, MunSafetyPanel, MunAgriculturePanel, MunPlanningPanel, MunDrrmOpsPanel, MunLocationPanel, MunKnowledgePanel, MunAnalyticsPanel, MunTransparencyPanel, MunSettingsPanel, MunSection, MunBar, MunFeedback}.tsx`.
- Owned, new libs: `src/lib/dashboard/{municipalStore, useMunicipalStore, municipalSelectors, municipalFormat, municipalWeather, useMunicipalWeather, useMunicipalLogout, munUi}.ts`.
- New i18n files: `src/lib/i18n/{munEn,munFil}.ts`.
- Owned, edited:
  - `dashboardData.ts`: municipal seed and statics added; LDRRMF changed to 45.2M/28.1M.
  - `ModuleNavBar.tsx`: optional `activeId`/`hideIds`/`ariaLabel`, backward compatible, plus `print:hidden`.
  - `CommandCenterDashboard.tsx`: imports `toTransparencyData` from `municipalSelectors`.
  - `dashboard/index.ts`: barrel exports appended.
- Shared files, additive edits only:
  - `src/types/index.ts`: `IMun*` block inserted before "Onboarding + Auth".
  - `Icon.tsx`: 4 icons (settings, printer, truck, calendar). I added 8 more earlier and then removed them per the scope reduction; those were my own additions from this session.
  - `en.ts` and `fil.ts`: an import plus a `...munEn` / `...munFil` spread at the top of each dictionary. The key sets match, enforced by `Record<IMunTranslationKey,string>`.
  - `README.md`: section appended before the footer, and the "Last updated" footer line amended.
- `src/app/dashboard/page.tsx`, three targeted edits:
  - The imports now use `MunicipalCommandView`, and the now-unused imports were dropped.
  - The lgu branch returns `<MunicipalCommandView name={session.name} />`.
  - The local `CommandCenterView` function was deleted.
  - Role precedence and guard code are untouched.

## Known gaps / assumptions
- Municipal edits and the audit log are in memory only (scope reduction). A reload resets them.
- Live DB `/api/reports` is not used. The seeded lgu account is Calamba, and the matrix forbids showing another municipality. Reports for Santa Cruz are store-backed.
- Beds remaining is derived as 1,200 − 812 = 388. The mock's "380" contradicts its own 812/1,200.
- Lists show 5 featured barangays. Headline copy still says 26.
