# Barangay Official dashboard: verification (code step)

Scope: the SCOPE REDUCTION rules at the top of `barangay-plan.md`. Per the orchestrator, this step did not start a dev server or run browser checks; the verify step owns those.

## Commands run (cwd = repo root, 2026-10-04)

| Command | Result |
| --- | --- |
| `npm run lint` | exit 0, no errors or warnings |
| `npx tsc --noEmit` | exit 0. An earlier run showed errors only in `src/components/dashboard/MunAgriculturePanel.tsx` (the concurrent municipal workflow's file, not edited here). They were gone on the re-run. |
| `npm test` (`node --test "tests/**/*.test.mjs"`) | 15 / 15 pass (`tests/barangay/barangayOps.test.mjs`) |
| `npm run build` (run once) | exit 0. Compiled, TypeScript finished, 25/25 static pages, `/dashboard` built |

The unit tests cover: evac status at 300/340/400 of 400 and standby; occupancy clamp; refusal to close an occupied shelter; Tanod dispatch and active-responder count (12); river status at 3.10/3.60/4.60/5.60 m; +0.15 m/hr trend; report counts 0 pending / 2 resolved, then add → respond → resolve; distribution deducting stock and rejecting over-stock or invalid input; DANA 3-hour countdown, overdue, and validation; SitRep containing barangay, municipality, and figures; QRF over-limit rejection; edits to own projects only; crop damage feeding DANA; audit WHO/WHEN/WHAT ordering; CDRA cap; widthClass.

## Not verified here (verify step)

Browser pass: desktop light, 375 px, one dark/EN spot check; the login → dashboard flow; and the role guard via `/dashboard?role=lgu` (the page never reads `?role=`; the role comes from `/api/auth/me` only).

## Demo login

Official tab on `/signin`: `brgy.sanroque` / `klimaguard2026` (Santa Cruz / San Roque, added additively to `prisma/seed.mjs` and upserted into the local `prisma/dev.db`) or `brgy.parian` / `klimaguard2026` (Calamba / Parian).
