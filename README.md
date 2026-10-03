# klimaguard-ph

Filipino-First Climate Intelligence Platform — Build Over Nights Hackathon.

A conversational AI climate assistant for Filipino communities (residents, farmers,
barangay officials) unifying weather, hazard alerts, and agricultural advisories.

## Setup

```bash
npm install
npm run db:push && npm run db:seed   # create + seed the local SQLite DB (prisma/dev.db)
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run db:generate                  # regenerate the Prisma client
npm run db:reset                     # force-reset the DB schema and re-seed
```

`npm test` runs Node's built-in test runner (`node --test "tests/**/*.test.mjs"`, no extra dependencies) on pure lib modules such as `lib/barangay/barangayOps.ts`.

## Tech Stack

Next.js 16.3.8 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS v4 (`@theme` in
`globals.css`, no config file) · date-fns v4 · Prisma 6.16.2 + SQLite · ESLint 9
(`eslint-config-next`) · deploy target Vercel (auto-deploy from `main`).

## Environment Variables

Names only; values live in the env files and must never be committed or copied here.

| File | Variable | Notes |
| --- | --- | --- |
| `.env.local` | `NEXT_PUBLIC_OPEN_METEO_BASE`, `NEXT_PUBLIC_GEOCODING_BASE` | API base URLs (code falls back to the canonical Open-Meteo hosts) |
| `.env.local` | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_DEFAULT_LAT`, `NEXT_PUBLIC_DEFAULT_LON`, `NEXT_PUBLIC_DEFAULT_LOCATION`, `NEXT_PUBLIC_DEFAULT_REGION` | Default location (Calamba, Laguna / CALABARZON) |
| `.env.local` | `PAGASA_API_KEY` | Server-only, optional; blank = Open-Meteo only |
| `.env.local` | `GROQ_API_KEY`, `GROQ_MODEL` | Server-only, read by `lib/agent/groqClient.ts`. Key from https://console.groq.com/keys; blank = deterministic Filipino demo replies. Model defaults to `openai/gpt-oss-120b` (Llama 3.x on Groq is Enterprise-only) |
| `.env` | `DATABASE_URL`, `SESSION_SECRET` | Prisma SQLite URL; HMAC secret for cookie sessions (required) |

`GEMINI_API_KEY` / `GEMINI_MODEL` in `.env.local` are blanked and unused.

## Chatbot Knowledge Base

Drop any `*.md` into `knowledgeFiles/`. It's picked up automatically: the folder is re-scanned every 30 s and on file change, with no restart needed.
Files are split by heading into ~1.2k-char chunks. The top 5 chunks per question (BM25, Filipino + English
stopwords) are sent to Groq along with the always-on persona/guardrail docs in `src/lib/agent/knowledge/`.
Clear `##` headings and the terms users would actually ask about make retrieval better.
`next.config.ts` traces both folders into the `/api/chat` function for Vercel.

Chat flow: emergency keywords → instant 911-first reply (no AI) → Groq (persona + KB + last 8 turns)
→ deterministic Filipino fallback if Groq is unset or fails.

## Typography

Montserrat = headings (`font-heading`, default on h1–h6) · Lexend = body (`font-sans`, default) ·
Poppins = UI accents (`font-ui`, default on buttons, inputs, labels, nav). Loaded with `next/font/google` in `layout.tsx`.

## Project Structure

```
prisma/
├── schema.prisma           # SQLite: User, Session, CommunityReport, MunicipalBudget, BudgetLine
└── seed.mjs                # demo users (officials mdrrmo.calamba, brgy.sanroque, brgy.parian), budgets, reports
tests/barangay/             # node --test unit tests for the barangay ops logic
knowledgeFiles/             # user KB markdown; auto-chunked + BM25-retrieved by KlimaChat
src/
├── app/
│   ├── layout.tsx          # fonts, no-flash theme script, Language/Auth/Theme providers, AlertBanner
│   ├── template.tsx        # per-navigation remount → .kg-page-transition fade-in (seamless route changes)
│   ├── globals.css         # Tailwind v4 @theme, dark variant, custom scrollbars, page-transition keyframes
│   ├── page.tsx            # auth-gated home: WeatherPanel + ChatWidget (redirects to /signin)
│   ├── signin/page.tsx     # resident OTP (simulated, demo 123456) + official username/password login
│   ├── onboarding/page.tsx # 4-step onboarding: role, location, details, permissions
│   ├── dashboard/page.tsx  # role from server session: lgu → Command Center, others → Resident view
│   ├── alerts/page.tsx     # hazard alerts, evacuation centers, hotlines, SMS broadcast log (M3/M4)
│   ├── agriculture/page.tsx # AgriculturePanel crop advisory (M5)
│   ├── transparency/page.tsx # public per-project DRRM tracker (M11), no sign-in
│   └── api/
│       ├── weather/        # GET Open-Meteo (PAGASA first if keyed), 15-min revalidate
│       ├── geocoding/      # GET PH-only place search
│       ├── pagasa/         # GET PAGASA TenDay forecast, null-safe fallback
│       ├── alerts/         # GET hazard state + hotlines (mock data, NDRRMC feed TODO)
│       ├── agriculture/    # GET crop advisory from live Open-Meteo weather
│       ├── chat/           # POST KlimaChat → askKlimaAgent (Node runtime)
│       ├── transparency/   # GET demo per-project DRRM data
│       ├── auth/           # otp, verify, login, me, logout, profile (DB-backed cookie sessions)
│       ├── reports/        # GET/POST scoped community reports; [id] PATCH official response
│       └── db/transparency/ # DB budget for the viewer's own municipality only
├── components/
│   ├── chat/               # ChatWidget, MessageBubble, EmbedCard, SuggestionChip, TypingIndicator, MarkdownText
│   ├── weather/            # WeatherPanel, WeatherCard (feels-like, rain warnings), ForecastStrip
│   ├── alerts/             # AlertBanner (sticky red, dismissible per signal), EvacuationCard
│   ├── agriculture/        # AgriculturePanel, CropAdvisoryCard, CropDamageRiskCard + FarmSafetyTab (farmer-only M3/M4)
│   ├── transparency/       # BudgetTracker, ProjectTracker, ProjectCard, ProjectDetail, ProjectProgressBar, ProjectStatusBadge
│   ├── resident/           # ResidentDashboard, ResidentSidebar, FamilyKitTab, ReportsTab (8 tabs)
│   ├── dashboard/          # Municipal Command Center: CommandCenterDashboard + panels/nav; MunCollapsibleSection (native <details> progressive disclosure for the Overview)
│   ├── barangay/           # Barangay Official dashboard: provider, sidebar, header, 6 tabs, M1–M11 panels, audit log
│   └── common/             # Auth/Language/Theme providers + toggles, AppHeader, HotlineFooter,
│                           # LocationSearch, SmsBroadcastLog, Icon (inline SVG)
├── hooks/                  # useLocation, useWeather (15-min client cache), useAlerts (offline-first), useNow (live clock)
├── lib/
│   ├── agent/              # quickClient (emergency override → Groq → fallback), groqClient, knowledgeBase, knowledge/*.md
│   ├── api/                # weather (Open-Meteo, 10 days), geocoding, pagasa, pagasaTenDay (Calamba TenDay issuance + merge), barangayWeather
│   ├── auth/               # crypto, session, otp, scope (role + location rules), http helpers
│   ├── db/prisma.ts        # Prisma client singleton
│   ├── i18n/               # en/fil dictionaries + translate() (Filipino default)
│   ├── sms/                # simulated OTP + hazard SMS broadcast (mock provider)
│   ├── barangay/           # barangayOps.ts (pure ops logic) + barangayData.ts (demo state)
│   ├── dashboard/          # municipal command-center demo data + municipalSelectors (in progress)
│   ├── transparency/       # transparencyData, localProjects (illustrative Calamba projects)
│   ├── agriculture/        # advisory rules + cropData + farmHazard (crop damage risk, farm/livestock safety content)
│   ├── onboarding/ resident/ # onboarding cards/options, resident tab + kit data
│   ├── constants/          # CHAT_FALLBACK_MESSAGE, CHAT_GREETING
│   └── utils/              # weatherCodes, dateFilipino, progressWidth (static Tailwind width classes)
└── types/index.ts          # shared I-prefixed types
```

## Data Sources

- **Open-Meteo**: baseline weather, free, no key, always `timezone=Asia/Manila`.
- **PAGASA TenDay**: active only when `PAGASA_API_KEY` is set; any failure falls back to Open-Meteo.
  `getPagasaForecast` parses TenDay by PSGC code; `fetchPagasaWeather` still returns `null`
  until the mapping is confirmed against a real response.
- **Geocoding**: Open-Meteo geocoding, filtered to `country_code === "PH"`.
- **Hazard alerts**: mock `IAlertState` in `/api/alerts`; the NDRRMC feed is not wired yet.
- **SQLite + Prisma**: local, role- and location-scoped app data (users, sessions, reports, budgets).
- **Caching**: API routes use `revalidate = 900` (15 min); `useWeather` and `useAlerts` cache on the client.
- **Weather resilience**: `fetchOpenMeteoWeather` keeps a server-side last-known-good reading per location (24 h). When Open-Meteo is unreachable (most often its free-tier daily HTTP 429), `/api/weather` and `/api/agriculture` serve the stale reading marked `stale: true` with a Filipino notice instead of hard-failing; it only errors when no prior reading exists.
- **Municipal weather resilience**: the Municipal Official M2 panel (`municipalWeather.ts`, used by M2/M5/M10) fetches Open-Meteo directly from the client for its full 10-day/hourly/soil payload. When that fetch fails it no longer dead-ends on a Filipino error — it now falls back to the seeded PAGASA Calamba TenDay snapshot via `buildMunicipalTenDaySnapshot()` (daily from the snapshot; hourly synthesized from day 1; soil moisture `null` → renders "—"), and only surfaces the error when the location is outside the snapshot's ~15 km Calamba coverage or the issuance has expired. The underlying fetch error is logged instead of silently swallowed. `IMunWeather.provider` (`"open-meteo"` | `"pagasa-snapshot"`) drives attribution, so `MunWeatherPanel` credits PAGASA (`MUN_WEATHER_SNAPSHOT_SOURCE`) when the fallback is served. The M5 (`MunAgriculturePanel`) and M10 (`MunAnalyticsPanel`) weather widgets now show a skeleton while loading and an error message with a Retry button (`mun.action.retry`) on failure, instead of a dead error string.

## Modules Implemented

- [x] M1 KlimaChat: chat UI + `/api/chat`, emergency override, Groq LLM with deterministic fallback, replies in the user's FIL/EN choice, fixed-height scrolling chat
- [x] M2 Weather: Open-Meteo client, WeatherCard/ForecastStrip/WeatherPanel
- [x] M3 Hazard Alerts: AlertBanner + `/alerts` (mock hazard data); farmer view adds crop damage risk level + livestock protection advisory
- [x] M4 Safety Advisor: EvacuationCard, hotlines, simulated SMS broadcast; farmer view adds "Bukid at Hayop" tab (crop protection steps, livestock evacuation guide, farm equipment checklist)
- [x] M5 Agriculture: crop advisory engine, AgriculturePanel, chat embed
- [x] M8 Location: LocationSearch + PH-only geocoding + useLocation
- [~] M9 Knowledge Base: in-repo KB (core docs + `knowledgeFiles/` BM25 retrieval); Amazon Quick Spaces not wired
- [x] M11 Transparency: BudgetTracker, per-project tracker at `/transparency`, DB-scoped budgets
- [x] M6/M7 Municipal Command Center (lgu role)
- [x] Resident dashboard: 8 tabs, role-highlighted sidebar
- [x] Auth: OTP sign-in, official login, DB-backed cookie sessions, onboarding
- [x] i18n EN/FIL toggle · light/dark theme toggle (light default, persisted) · inline SVG icons
- [~] Database: schema, seed, auth, and scoped report/budget routes done; not all features use the DB yet
- [x] Barangay Official dashboard: own-role sidebar + logout, 6 design tabs, compact M1/M2/M3–M7/M4/M5/M6/M10/M11 panels, in-memory audit log
- [x] Test runner: `npm test` (node --test)
- [ ] PAGASA live weather mapping · NDRRMC live hazard feed

## Simulated SMS

OTP (demo code `123456`) and hazard SMS broadcasts are simulated; nothing is sent.
`lib/sms/` is provider-pluggable: swap `mockProvider` for Semaphore/Twilio to go live.

## Kiro Hooks (`.kiro/hooks`)

All run on file save.

- `api-fallback-check`: checks API calls have error handling and graceful fallbacks.
- `emergency-override`: checks emergency alert components keep visual priority.
- `filipino-check`: checks user-facing strings default to Filipino.
- `sync-readme`: updates this README when files in `src/app`, `components`, or `lib` change.

## Progress / Changelog

Build and lint results below come from the per-module verification reports in `.agents/tasks/`.

| Cycle | Work | Verification | Open follow-ups |
| --- | --- | --- | --- |
| 0 | `f90c09b` initial scaffold | n/a | |
| 2 | `66895c8` M2 weather + M8 location | build + lint pass (`m2-verification.md`); review approved | Geocoding also drops PH hits without `admin1`; PAGASA mapping is a stub |
| 3 | `74bbb59`, `bcce70d`, `57ff5ff` M3/M4 alert types, API, useAlerts, AlertBanner, EvacuationCard, `/alerts` | build + lint pass in worktree; review approved | NDRRMC `tel:` link dials only the first number |
| 4 | `5c0dae8` M1 KlimaChat + chat API + knowledge base; `73bc1fc` theme system; `66c48da` M5 agriculture; `6025e99` geocoding/pagasa polish; `ae41687` M11 BudgetTracker | M1 + M1 follow-up build + lint pass, reviews approved; M5 review approved | M5 chat embed uses a fixed demo seed, not live location |
| 5 | `af031cb` M11 transparency tracker; `0cb99b0`, `b627722` feels-like temp, rain warnings, flat Open-Meteo helpers | M11 build + lint pass; review approved | M11 review flagged dynamic `w-[${pct}%]` widths (now handled by `utils/progressWidth.ts`) |
| 6 | `ab76705`, `e05a725` merge M3/M4 into main | merge commit | |

M1 follow-up (`2026-10-04-002136-review.md`, approved): extracted the server-only agent into
`quickClient.ts`, added the class-based light/dark theme with toggle, and moved the shared
fallback/greeting strings into `lib/constants`.

Uncommitted work on `main` (in progress, not yet a cycle commit):

- Prisma/SQLite DB, auth API (OTP, verify, login, me, logout, profile), scoped reports and DB transparency routes.
- Sign-in and onboarding pages, role-aware `/dashboard`, Resident dashboard, Municipal Command Center (`municipal-plan.md`).
- EN/FIL i18n, simulated SMS layer, AppHeader/HotlineFooter, Icon set, public `/transparency` project tracker.
- KlimaChat moved from Gemini to Groq (`geminiClient.ts` deleted, `groqClient.ts` added) with `knowledgeFiles/` retrieval and `MarkdownText` rendering.
- Barangay Official dashboard (`barangay-plan.md`, scope-reduced): done. To see it, sign in with the Official tab as `brgy.sanroque` / `klimaguard2026` (Santa Cruz / San Roque, matching the design) or `brgy.parian`. `/dashboard` takes the role from the server session only and ignores `?role=`. The sidebar shows only "Barangay Official", plus Mag-log out. Tabs: Operations Grid, Evacuation Centers, Tanod Patrols, River Sensors, Relief Goods, Citizen Incident Reports. Modules: KlimaChat, weather detail (hourly heat/rain mm/wind/UV), DRRM ops (checklist auto-activated on Signal ≥2, DANA with 3-hour countdown → SitRep, affected population, QRF), M4 broadcast, M5 area-wide, M6 planning, M10 analytics, M11 (municipal budget view only + edit own projects), and the audit log. Ops data is demo data held in memory (resets on reload). Community reports and the budget come from the DB, scoped server-side.
- Fonts: Geist and the hard-coded Arial body replaced by Lexend / Montserrat / Poppins (steering docs updated).
- Safety: chat emergency override; AlertBanner dismissal is now per-session (sessionStorage); footer 911 link is 44×44 px.
- PAGASA 10-Day Climate Forecast (2026-10-04): `lib/api/pagasaTenDay.ts` holds the official TenDay export for the City of Calamba (issued 2026-10-01, valid until 2026-10-10, GFS by NOAA, LAT 14.2117 / LON 121.1653), copied from `tenday-20261004-011555.pdf`.
  - **Where it's used:** `/api/weather` merges it per date, preferring PAGASA's temps, rainfall in mm/day and descriptors, and keeping Open-Meteo's real rain probability. Open-Meteo now requests 10 days and fills any days after the issuance. Coverage is about 15 km around Calamba; elsewhere the forecast is Open-Meteo only.
  - **Expiry:** after Oct 10 the snapshot expires on its own.
  - **Open-Meteo fallback:** if Open-Meteo fails (it hit its daily 429 limit during testing), the route serves a PAGASA-only payload for Calamba. Current conditions come from the export's "today" box (26.1°C, 93%, 1.3 m/s).
  - **ForecastStrip:** shows "N araw na forecast", a PAGASA TenDay badge, mm/day plus %, and full FIL/EN attribution (issued / valid until / model).
  - **KlimaChat:** weather and farm questions get the TenDay table in the prompt, so answers cite PAGASA figures instead of guesses.
  - **Verified:** tsc 0, lint clean. `/api/weather` returns 7 PAGASA days (Oct 4–10) with `source: PAGASA` while Open-Meteo is rate-limited.
- Chat typing field: the card height is now `min(100dvh − 9rem, 620px)` so the input fits on screen. Dashboard chat tabs (`revealOnMount`) scroll it into view and focus it when opened.
- Responsive UI + language (2026-10-04):
  - **Chat sizing:** ChatWidget has a bounded height (`min(75dvh, 680px)`, min 420px) and only the message list scrolls (`min-h-0` + `overscroll-contain`), so it no longer grows with every message. It scrolls only its own list, never the page. On the home page, md+ screens show weather and chat side by side with a sticky chat card; mobile stacks them. The chat input is 16px on mobile to stop iOS zoom.
  - **Language:** the FIL/EN toggle has 44px targets, readable hover in light mode, `radiogroup` semantics, and FIL listed first. `<html lang="fil" suppressHydrationWarning>` stops theme/lang hydration warnings.
  - **Chat follows the selected language:** ChatWidget sends `language` to `/api/chat`. The system prompt gets a language rule that wins over the knowledge-base language. Fallback replies, emergency replies, suggestion chips, the greeting and embed card labels are all bilingual. Earlier messages stay in the language they were sent in. Emergency keywords now include English phrases.
  - **Other fixes:** the resident sidebar is compact on mobile (role + log out; the module list shows on lg+ only) and the header is tighter at 375px. The municipal chat panel stacks on mobile. The transparency embed bar used a dynamic `w-[${pct}%]` class Tailwind never generates; it now uses `progressWidthClass`. The duplicate theme toggle in the chat header is removed.
  - **Groq free tier:** the limit is 8k tokens/min. Retrieval is trimmed (top 4 chunks, ~3.8k chars) and `max_completion_tokens` is 700. On a 429 the client honours Groq's "try again in Xs" hint and waits up to 8 s, then falls back.
  - Verified: tsc 0 errors, lint clean. `/`, `/dashboard`, `/alerts`, `/transparency`, `/signin` return 200. Live Groq replies in EN and FIL each follow the toggle, not the question's language.
- Farmer M3/M4 (v6 matrix rows): `lib/agriculture/farmHazard.ts` derives a crop damage risk level (Mababa/Katamtaman/Mataas/Napakataas) from the typhoon signal plus the next-3-day rain, wind and heat forecast. It lists exposed crops (palay, gulay, saging, mais, niyog), one crop action, and a livestock protection advisory. This shows in the farmer's Alerts tab and on `/alerts`. A new farmer-only "Bukid at Hayop" tab has three saved checklists: crop protection, livestock evacuation, and farm equipment. Content is bilingual with Filipino as the default. Red is used only for "severe" (signal 3 and up). Verified: tsc 0 errors, lint clean, risk scenarios (calm → low, rain 70% → moderate, rain 85% + wind 62 km/h → high, 36°C → moderate, signal 3 → severe), and `/alerts` and `/dashboard` return 200.
- M11 per-project tracker: 8 demo Calamba projects (Looc, Parian, Canlubang, Real, Bucal, Halang, Pansol, Lecheria), barangay/status filters, per-project detail with milestones. Shown at `/transparency`, in the Resident relief tab (pre-filtered to the user's barangay), and on the Command Center. `/api/transparency` returns the per-project payload (`?barangay=&status=`).
- Verified 2026-10-04 on the dev server: `/`, `/transparency`, `/api/transparency`, and `/api/chat` (general, project, emergency) return 200. Served CSS has Lexend/Montserrat/Poppins and no Geist. ESLint shows 0 errors. `tsc` is clean for these changes; the remaining errors are in the in-progress `lib/barangay/barangayData.ts` / `i18n/fil.ts` (missing `brgy.*` keys). Live Groq replies are untested until `GROQ_API_KEY` is set.

Unmerged worktree branches (not merged into `main`):

- `klimachat-dashboard` (`.worktrees/klimachat-dashboard`): `9616577` KlimaChat dashboard shell, Sidebar, HazardBanner, redesigned chat column. Its commit reports build + lint pass.
- `feat/rbac-foundation` (`.worktrees/rbac-foundation`): `da11c4f` roles, access matrix, current-user resolution (phase 1).
- `feat/m3-m4-alerts` is fully merged.

---

## Municipal Official dashboard (role `lgu`)

MDRRMO Command Center for the City of Calamba, Laguna (`src/components/dashboard/MunicipalCommandView.tsx`, rendered by `/dashboard` for `lgu` sessions). Sign in from the Official tab as `mdrrmo.calamba` / `klimaguard2026` (seeded with municipality Calamba).

- Light by default. The header toggle switches to dark using theme tokens. The red override bar (with a 911 call button) shows while the emergency protocol is active.
- The sidebar shows only "Municipal Command" plus the signed-in name, Active Modules, a telemetry footer, and **Mag-log out**. Log out is also available in Settings.
- There are 12 working module tabs: Overview (with the emergency block first), M1 to M11, and Settings. Panels are kept compact per the scope reduction.
- Working actions:
  - Approve or return a barangay DANA.
  - Edit evacuation-center occupancy or switch a center between open and standby.
  - Dispatch relief from the municipal warehouse.
  - Trigger and acknowledge the DRRM checklist.
  - Send BDRRMC directives and broadcast the SitRep (logged in the SMS Broadcast Log).
  - Allocate RCEF seed.
  - Toggle CDRA steps and CLUP zones, and set CCET tags.
  - Edit project status for any barangay, respond to or resolve reports for any barangay, and submit a report for any barangay.
  - Add a municipal budget line.
  - Switch the emergency protocol on or off and set its level.
- **DANA Executive Report (PDF)** and **TOC Printout** open the print dialog on a print-styled sheet. Choose "Save as PDF" to download.
- Every edit adds an audit entry (WHO / WHEN / WHAT) to the M11 audit log. State lives in memory in `src/lib/dashboard/municipalStore.ts` (demo-grade).
- Location (2026-10-04): moved from Santa Cruz to **Calamba, Laguna** (14.2117°N, 121.1653°E; 54 barangays). The 5 featured barangays are real Calamba barangays: Parian, Lingga, Palingon, Bucal, and Barangay 1 (Poblacion). The river gauge and bridge station are now on the San Cristobal River. The map, title, location pill, SitRep/SMS text, print titles, and attribution all say Calamba, and only Calamba data appears.
- Data comes from `src/lib/dashboard/dashboardData.ts`: Parian is the anchor barangay (Parian Covered Gym 300/400, Parian Elementary School on standby with 250 capacity, 1,240 at risk in Purok 3 & 4, 2 reports resolved, Parian Lakeshore Dike at 85%), plus headline totals of 1,420 households, 812/1,200 shelter occupancy, and 62% LDRRMF use.
- The Barangay Official dashboard was not moved. `brgy.sanroque` is still San Roque, Santa Cruz (per its Stitch design), so its figures no longer appear in the Calamba command center. `brgy.parian` is the Calamba barangay account.
- The M2 10-day, hourly, and soil forecast is fetched live from Open-Meteo with `timezone=Asia/Manila` and a 15-minute cache.

---
- Full codebase + database audit (2026-10-04): toolchain verified green (lint, tsc, build, 18 tests, prisma validate). Fixed a weather resilience defect — `fetchOpenMeteoWeather` now keeps a 24 h server-side last-known-good reading per location and serves it marked `stale` (with a Filipino notice) when Open-Meteo is unreachable (e.g. its free-tier HTTP 429), instead of hard-failing `/api/weather` and `/api/agriculture`. Added `IWeatherData.stale`/`notice`, 3 regression tests (`tests/api/weatherResilience.test.mjs`), and a `@/`→`src/` test alias loader. Removed dead scaffold placeholders (`app/chat/index.ts`, `app/alerts/index.ts`, `api/transparency/index.ts`) and silenced the `node --test` reparse warning. Full report in `.agents/tasks/full-audit-findings.md` + `full-audit-verification.md`.

---
- UI polish (2026-10-05): global seamless scrollbars + page transitions (issue 1 & 5). Added theme-aware `--sb-thumb`/`--sb-thumb-hover` CSS vars and global WebKit/Firefox scrollbar rules (thin 8px, rounded, teal-tinted, transparent track, no arrow buttons) in `src/app/globals.css`; the 8px height also covers the horizontal municipal ModuleNavBar tab bar. Alert Red / `.bg-alert` left untouched. Added `src/app/template.tsx` (Server Component, no `use client`) wrapping children in `.kg-page-transition`, with a 220ms `kg-fade-in` keyframe disabled under `prefers-reduced-motion`.
- Municipal navigation + Overview IA (2026-10-05, issues 4 & 6, FEAT-004): added a role-gated **Dashboard** link in `AppHeader` (Icon `command`, `t('nav.dashboard')`, teal, 44px tap target, focus-visible ring) shown only to officials (`lgu`/`barangay`) via an inline role check — the server-only `lib/auth/scope.ts` is not imported client-side. Added the new `src/components/dashboard/MunCollapsibleSection.tsx` (native `<details>`/`<summary>`, SSR-safe, zero-JS, chevron rotation, cmd-* tokens + dark variants) and restructured `MunOverviewPanel` for progressive disclosure: the emergency block (when active) and the KPI cards stay visible first, while field telemetry, command metrics, the river monitor, and directives+agency sync collapse into expandable sections. No panel or data was removed; the Overview stays single-column at 375px. New i18n keys at parity: `nav.dashboard` (fil/en) and `mun.sec.overviewGlance` / `mun.sec.directivesGroup` (munFil/munEn). Verified: `npm run lint ; npm run build` both exit 0.

---
_Last updated: 2026-10-05 (municipal M2 TenDay weather fix: Open-Meteo failure in the Municipal panel now falls back to the seeded PAGASA Calamba snapshot via `buildMunicipalTenDaySnapshot()` instead of dead-ending on "Hindi makuha ang 10-day forecast", the fetch error is logged not swallowed, attribution switches to PAGASA on fallback via `IMunWeather.provider`, and the M5/M10 weather widgets gained a loading skeleton + Retry button; earlier: municipal Dashboard header link for officials + Overview progressive-disclosure collapsible sections; earlier: seamless custom scrollbars + root template page-transition fade; earlier: full codebase + database audit: weather outage resilience fallback, dead-placeholder cleanup, test alias loader; earlier: Municipal Official command center relocated to Calamba, Laguna; responsive UI + chatbot follows FIL/EN toggle + fixed-height chat; Barangay Official dashboard + `npm test`; farmer crop damage risk, Groq chatbot + markdown KB, new fonts, per-project transparency)_
