# Project Structure

Next.js App Router with a `src/` directory and `@/*` → `src/*` aliasing. Most files are currently placeholders (`export {}` or scaffold content) organized by feature domain.

## Directory Layout

```
klimaguard-ph/
├── .kiro/
│   ├── steering/        # product.md, structure.md, tech.md
│   ├── hooks/           # automation hooks
│   ├── specs/           # feature specs per module
│   └── settings/mcp.json
├── src/
│   ├── app/
│   │   ├── layout.tsx           # root layout
│   │   ├── page.tsx             # home dashboard
│   │   ├── chat/page.tsx        # chat screen
│   │   ├── alerts/page.tsx      # emergency alerts
│   │   └── api/
│   │       ├── weather/route.ts
│   │       ├── geocoding/route.ts
│   │       ├── alerts/route.ts
│   │       ├── agriculture/route.ts
│   │       ├── transparency/route.ts
│   │       └── pagasa/route.ts
│   ├── components/
│   │   ├── chat/           # ChatWidget, MessageBubble, SuggestionChip
│   │   ├── weather/        # WeatherCard, ForecastStrip
│   │   ├── alerts/         # AlertBanner, EvacuationCard
│   │   ├── agriculture/    # CropAdvisoryCard
│   │   ├── transparency/   # BudgetTracker
│   │   ├── dashboard/      # DashboardLayout
│   │   └── common/         # LocationSearch, LoadingSpinner
│   ├── lib/
│   │   ├── api/            # weather.ts, geocoding.ts, pagasa.ts
│   │   ├── constants/
│   │   └── utils/          # weatherCodes.ts, dateFilipino.ts
│   ├── types/index.ts
│   └── hooks/              # useLocation.ts, useWeather.ts
```

## Feature Domains

The app is organized around consistent feature domains that recur across layers:
`weather`, `alerts`, `agriculture`, `transparency`, `chat`, plus `geocoding` (API) and `dashboard` / `common` (components).

When adding a feature, keep its code within the matching domain folder across `app`, `components`, and (if needed) `lib`/`types`.

## Naming Conventions

- **Components:** PascalCase, one per file (`WeatherCard.tsx`).
- **Utils / API:** camelCase (`weatherCodes.ts`, `geocoding.ts`).
- **Types:** PascalCase with `I` prefix (`IWeatherData`).
- **Pages:** lowercase folders using App Router convention (`chat/page.tsx`).
- **Hooks:** camelCase with `use` prefix (`useLocation.ts`).
- **Folders:** lowercase by domain.

## Module-to-File Mapping

| Module | Location |
| --- | --- |
| M1 KlimaChat | `components/chat/*`, `lib/agent/*` |
| M2 Weather | `components/weather/*`, `lib/api/weather.ts` |
| M3 Hazard Alerts | `components/alerts/AlertBanner.tsx` |
| M4 Safety Advisor | `components/alerts/EvacuationCard.tsx` |
| M5 Agriculture | `components/agriculture/*` |
| M8 Location | `components/common/LocationSearch.tsx` |
| M9 Knowledge Base | Amazon Quick Spaces (external) |
| M11 Transparency | `components/transparency/*` |

## Conventions

- **Barrel files:** each domain folder currently has an `index.ts` barrel. Export public symbols from `index.ts`; import via the `@/` alias (e.g. `@/components/weather`).
- **App Router API routes:** the scaffold currently has `src/app/api/<domain>/index.ts` placeholders. Next.js serves route handlers from `route.ts` — create the actual handler as `src/app/api/<domain>/route.ts` with named `GET`/`POST` exports when implementing endpoints.
- **Server vs client:** keep secrets and PAGASA/external calls in server code (route handlers / server components). Client components only read `NEXT_PUBLIC_` values.
- **Root layout:** `src/app/layout.tsx` sets fonts and the root `<html>`/`<body>`. Global styles live in `src/app/globals.css`.

## Config Files (root)

- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` — framework/tooling config.
- `.env.local` — environment variables (see tech.md).
- `AGENTS.md` / `CLAUDE.md` — agent guidance; `AGENTS.md` carries the Next.js version note. Keep its managed block intact.
