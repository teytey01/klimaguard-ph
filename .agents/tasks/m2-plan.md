# Implementation Plan — M2 Weather + M8 Location Intelligence

Feature: real-time weather for any Philippine location + location search/GPS, wired into the home dashboard. Stack confirmed from the repo: Next.js 16.3.8 App Router (NOT Pages), React 19, TypeScript 5 strict, Tailwind v4, `date-fns@^4.4.0`, npm, Windows/PowerShell.

## Key findings from exploration (ground truth — do not re-decide)

- **Route handlers (Next 16):** `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` confirms handlers live in `route.ts` with named method exports (`export async function GET(request: Request)`). The scaffold's `src/app/api/<domain>/index.ts` files are NOT served by Next — they are inert `export {}` placeholders. The existing served handler is `src/app/api/chat/route.ts` (uses `NextResponse.json`, try/catch, graceful fallback) — follow its pattern.
- **Caching (Next 16, Cache Components OFF):** `next.config.ts` has no `cacheComponents` flag, so the "previous model" applies (`caching-without-cache-components.md`). Route handlers are NOT cached by default. For a 15-minute minimum server cache use BOTH: (a) route segment config `export const revalidate = 900;` in each weather/geocoding `route.ts`, and (b) on each upstream `fetch(...)` pass `{ next: { revalidate: 900 } }` (per `fetch.md`: `next.revalidate` is "cache lifetime in seconds", 900 = 15 min). Do NOT use `use cache`/`cacheLife` (that is the Cache Components path, not enabled here). `900` is the confirmed option VALUE; `next.revalidate` / `export const revalidate` are the confirmed option NAMES for this version.
- **date-fns `fil`/Tagalog locale:** NOT present in `node_modules/date-fns/locale` (only `en-*` English variants exist). So `dateFilipino.ts` MUST hand-roll Filipino day/month name arrays (do not import a `fil` locale — it will fail the build). Use `date-fns` only for safe date math/parsing (e.g. `parseISO`, `getDay`, `getDate`, `getMonth`) and map indices to the Filipino arrays.
- **Barrel convention:** domain `index.ts` re-exports with `export { default as Name } from "@/..."` plus `export type { IProps } from "@/..."`. Import everywhere via the `@/` alias. See `src/components/common/index.ts`.
- **Semantic Tailwind tokens already defined** in `src/app/globals.css` via `@theme inline`: `bg-app-bg`, `bg-surface-2`, `bg-card`, `text-text`, `text-text-muted`, `bg-navy`, `text-teal`/`border-teal`, `bg-alert`. These are theme-aware (flip automatically with the `.dark` class), so PREFER them over raw hex. They satisfy the steering token table and light/dark requirement in one. Use raw hex (e.g. `dark:bg-[#16263D]`) only where no semantic token exists. Do NOT use `bg-alert` for normal weather (emergency only).
- **Components:** functional, one per file, `"use client"` only when interactive (hooks/handlers/geolocation). Props interface `IXxxProps` exported in the same file. See `ThemeToggle.tsx`, `ChatWidget.tsx`.
- **ThemeProvider/useTheme** exist in `src/components/common`. `src/app/page.tsx` currently renders only `<ChatWidget/>` inside `<div className="flex flex-1 bg-app-bg">`. `src/app/layout.tsx` sets Geist fonts + ThemeProvider + no-flash script — PRESERVE it; do not edit layout for this task.
- **Env:** `.env.local` has `NEXT_PUBLIC_OPEN_METEO_BASE`, `NEXT_PUBLIC_GEOCODING_BASE`, `NEXT_PUBLIC_DEFAULT_LAT=14.2117`, `NEXT_PUBLIC_DEFAULT_LON=121.1653`, `NEXT_PUBLIC_DEFAULT_LOCATION=Calamba, Laguna`, `NEXT_PUBLIC_DEFAULT_REGION=CALABARZON`, `PAGASA_API_KEY=` (blank). PAGASA is server-only; read with `process.env.PAGASA_API_KEY` ONLY inside `pagasa/route.ts` or `lib/api/pagasa.ts` running server-side — never in a client component. Base-URL `NEXT_PUBLIC_*` vars may be read client- or server-side.
- **AGENTS.md** has a managed `<!-- BEGIN:nextjs-agent-rules -->` block — do NOT touch it.
- **No test runner configured** (`package.json` scripts: dev/build/start/lint only, no `test`). Primary verification is `npm run lint` + `npm run build` (production build = full typecheck + route compilation). Add a test runner only if explicitly needed; this plan verifies via lint + build + a dev-server smoke check.

## Verification commands (project-real)

- Typecheck + compile + route detection: `npm run build`
- Lint (ESLint 9 + eslint-config-next, core-web-vitals + typescript): `npm run lint`
- Manual smoke (optional, do not leave running as a blocking bg task): `npm run dev` then hit `http://localhost:3000/api/geocoding?q=Calamba` and `http://localhost:3000/api/weather?lat=14.2117&lon=121.1653`.

Run `npm run lint` AND `npm run build` after each item (or at least at the end of each cluster); both MUST pass with zero errors. Every item must leave the tree buildable.

---

# Implementation Plan

- [ ] 1. Add all weather/location TypeScript interfaces to `src/types/index.ts` (append; do not remove existing chat types).
      Define and export (all `I`-prefixed, no `any`): `ILocation { name: string; province: string; lat: number; lon: number; region?: string }`; `IGeocodingResult { name: string; admin1: string; lat: number; lon: number; country_code: string }` (province = `admin1`); `IGeocodingResponse { results: IGeocodingResult[] }`; `IWeatherSource = "Open-Meteo" | "PAGASA"`; `ICurrentWeather { temperatureC: number; weatherCode: number; humidity: number; rainChance: number; windSpeedKmh: number }`; `IForecastDay { date: string /* ISO yyyy-MM-dd */; weatherCode: number; highC: number; lowC: number; rainChance: number }`; `IWeatherData { location: ILocation; current: ICurrentWeather; forecast: IForecastDay[]; source: IWeatherSource; fetchedAt: string }`. These shapes are the contract the route handlers return and the hooks/components consume.
      Files: `src/types/index.ts`
      Verify: `npm run build` compiles with no type errors.

- [ ] 2. Create the WMO-code → Filipino label+emoji utility.
      Export `interface IWeatherDescription { label: string; emoji: string }`, a const map `WMO_FILIPINO: Record<number, IWeatherDescription>` covering ALL required codes `0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99` (0="Maaraw"/☀️, 61="Umuulan"/🌧️, 95="May bagyo"/⛈️, and sensible Filipino labels for the rest, e.g. 1/2/3 maaraw/maulap variants, 45/48 maulap/hamog, 51-57 ambon, 63/65 malakas na ulan, 71-77 niyebe/graupel, 80-82 pabugso-bugsong ulan, 95-99 kulog't kidlat/bagyo), and a helper `describeWeather(code: number): IWeatherDescription` that returns the mapped entry or a safe Filipino default (`{ label: "Hindi matukoy", emoji: "❓" }`) for unknown codes. No `any`.
      Files: `src/lib/utils/weatherCodes.ts`
      Verify: `npm run build` passes.

- [ ] 3. Create the Filipino date-formatting utility (hand-rolled — date-fns has no `fil` locale).
      Define Filipino arrays `ARAW` (days: Linggo, Lunes, Martes, Miyerkules, Huwebes, Biyernes, Sabado) and `BUWAN` (months: Enero…Disyembre). Export `formatFilipinoDate(iso: string): string` → "Biyernes, Oktubre 3" (day name, month name, day-of-month) and `formatFilipinoShortDay(iso: string): string` → short label for the forecast strip (e.g. "Biy" / "Okt 3"). Use `date-fns` `parseISO` for parsing and `getDay`/`getDate`/`getMonth` for indices, then index into the Filipino arrays. No `any`; guard invalid input with a graceful fallback string.
      Files: `src/lib/utils/dateFilipino.ts`
      Verify: `npm run build` passes.

- [ ] 4. Update the utils barrel to export the two new utilities.
      Replace `export {}` with named re-exports of `weatherCodes` (`WMO_FILIPINO`, `describeWeather`, type `IWeatherDescription`) and `dateFilipino` (`formatFilipinoDate`, `formatFilipinoShortDay`, and arrays if public).
      Files: `src/lib/utils/index.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 5. Create the geocoding route handler (server) that proxies Open-Meteo Geocoding and filters to PH only.
      `src/app/api/geocoding/route.ts`: `export const revalidate = 900;` + `export async function GET(request: Request)`. Read `q` from `new URL(request.url).searchParams` (min length guard → return `{ results: [] }`). Call the lib client (item 7). Return `NextResponse.json<{ results: IGeocodingResult[] }>`. Wrap in try/catch; on failure return `{ results: [] }` with status 200 (so the UI shows an empty/Filipino state, not a crash). Normalize each upstream result to `{ name, admin1, lat, lon, country_code }` and KEEP ONLY `country_code === "PH"`. Also delete the stale `src/app/api/geocoding/index.ts` placeholder (Next ignores it, but remove to avoid confusion).
      Files: `src/app/api/geocoding/route.ts` (create), `src/app/api/geocoding/index.ts` (delete)
      Verify: `npm run build` lists `/api/geocoding` as a route; `npm run dev` + `GET /api/geocoding?q=Calamba` returns only PH results in `{name, admin1, lat, lon, country_code}` shape.

- [ ] 6. Create the weather route handler (server) that proxies Open-Meteo Forecast, with PAGASA attempted first then silent fallback.
      `src/app/api/weather/route.ts`: `export const revalidate = 900;` + `export async function GET(request: Request)`. Read `lat`, `lon`, optional `name`/`province` from search params (validate numbers; on missing/NaN fall back to env defaults `NEXT_PUBLIC_DEFAULT_LAT/LON/LOCATION`). Flow: try PAGASA client (item 9) FIRST — if it returns data (only when `PAGASA_API_KEY` is set and the call succeeds), use it with `source: "PAGASA"`; otherwise SILENTLY call the Open-Meteo client (item 8) with `source: "Open-Meteo"`. Return `NextResponse.json<IWeatherData>`. Full try/catch; on total failure return 503 with `{ error: "<Filipino message>" }` (e.g. "Hindi makuha ang panahon ngayon. Pakisubukan ulit."). Delete stale `src/app/api/weather/index.ts`.
      Files: `src/app/api/weather/route.ts` (create), `src/app/api/weather/index.ts` (delete)
      Verify: `npm run build` lists `/api/weather`; `GET /api/weather?lat=14.2117&lon=121.1653` returns a full `IWeatherData` with `source: "Open-Meteo"`, 7 forecast days, and `timezone=Asia/Manila` reflected in the data.

- [ ] 7. Create the geocoding lib client used by the route handler.
      `src/lib/api/geocoding.ts`: `export async function fetchGeocoding(query: string): Promise<IGeocodingResult[]>`. Build URL from `process.env.NEXT_PUBLIC_GEOCODING_BASE` + `/search?name=<q>&count=10&language=en&format=json` (add `countryCode=PH` if supported, but STILL filter in code). `fetch(url, { next: { revalidate: 900 } })`. try/catch → on error return `[]`. Map upstream `{ name, admin1, latitude, longitude, country_code }` → `IGeocodingResult`, filter `country_code === "PH"`. No `any` (type the upstream JSON with a local interface).
      Files: `src/lib/api/geocoding.ts`
      Verify: `npm run build` + `npm run lint` pass; exercised via item 5's dev smoke.

- [ ] 8. Create the Open-Meteo weather lib client (baseline no-key provider).
      `src/lib/api/weather.ts`: `export async function fetchOpenMeteoWeather(loc: ILocation): Promise<IWeatherData>`. Build URL from `process.env.NEXT_PUBLIC_OPEN_METEO_BASE` + `/forecast` with params: `latitude`, `longitude`, `timezone=Asia/Manila` (ALWAYS), `current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`, `forecast_days=7`. `fetch(url, { next: { revalidate: 900 } })`. Map response → `IWeatherData` (`current` from `current.*`, `forecast` by zipping `daily.time[i]` with the daily arrays, `source: "Open-Meteo"`, `fetchedAt: new Date().toISOString()`). try/catch → rethrow or return a typed error the route maps to the Filipino 503. No `any`.
      Files: `src/lib/api/weather.ts`
      Verify: `npm run build` + `npm run lint`; exercised via item 6's dev smoke returning 7 days.

- [ ] 9. Create the PAGASA lib client (server-only, additive, silent fallback).
      `src/lib/api/pagasa.ts`: `export async function fetchPagasaWeather(loc: ILocation): Promise<IWeatherData | null>`. Read `process.env.PAGASA_API_KEY`; if blank/undefined return `null` immediately (the default path). If present, `fetch("https://api.pagasa.dost.gov.ph/v1/tenday/forecast", { headers with key, next: { revalidate: 900 } })`, map to `IWeatherData` with `source: "PAGASA"`. ANY error or non-OK → return `null` (never throw) so the weather route silently uses Open-Meteo. The exact PAGASA response field mapping cannot be verified without a key — mark the mapping body `// needs verification during implementation` and keep the null-fallback airtight so the Open-Meteo path is unaffected. MUST NOT be imported by any client component. Delete stale `src/app/api/pagasa/index.ts` and create `src/app/api/pagasa/route.ts` as a thin GET that calls this client and returns its result or a Filipino message (keeps the documented endpoint present).
      Files: `src/lib/api/pagasa.ts` (create), `src/app/api/pagasa/route.ts` (create), `src/app/api/pagasa/index.ts` (delete)
      Verify: `npm run build` lists `/api/pagasa`; with blank key, `/api/weather` still returns `source: "Open-Meteo"` (no PAGASA call made).

- [ ] 10. Update the lib/api barrel to export the three clients.
      Replace `export {}` with named re-exports of `fetchGeocoding`, `fetchOpenMeteoWeather`, `fetchPagasaWeather`.
      Files: `src/lib/api/index.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 11. Create the `useLocation` hook (client) managing selected location state.
      `src/hooks/useLocation.ts` (`"use client"`): `export function useLocation()` returns `{ location: ILocation; setLocation: (l: ILocation) => void; useMyLocation: () => void; geoError: string | null; isLocating: boolean }`. Default `location` from env defaults (`NEXT_PUBLIC_DEFAULT_LAT/LON/LOCATION/REGION`; split "Calamba, Laguna" into name/province). `useMyLocation` calls `navigator.geolocation.getCurrentPosition`; on success set a location named "Aking Lokasyon" (province empty) at the returned coords; on denial/error set `geoError` to a Filipino message (e.g. "Hindi ma-access ang iyong lokasyon. Pakipili na lang sa paghahanap."). No `any`.
      Files: `src/hooks/useLocation.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 12. Create the `useWeather` hook (client) with a 15-minute client-side cache.
      `src/hooks/useWeather.ts` (`"use client"`): `export function useWeather(location: ILocation)` returns `{ data: IWeatherData | null; isLoading: boolean; error: string | null; refetch: () => void }`. On location change, `fetch('/api/weather?lat=..&lon=..&name=..&province=..')`. Maintain a module-level `Map<string, { data: IWeatherData; ts: number }>` keyed by `lat,lon`; serve cached data when `Date.now() - ts < 15 * 60 * 1000` (15-min min client cache) and skip the network. try/catch → set `error` to a Filipino message on failure. No `console.log`. No `any`.
      Files: `src/hooks/useWeather.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 13. Update the hooks barrel to export both hooks.
      Replace `export {}` with `export { useLocation } from "@/hooks/useLocation";` and `export { useWeather } from "@/hooks/useWeather";`.
      Files: `src/hooks/index.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 14. Create the `LocationSearch` component (client) with autocomplete + GPS button.
      `src/components/common/LocationSearch.tsx` (`"use client"`): export `interface ILocationSearchProps { onSelect: (l: ILocation) => void; onUseMyLocation: () => void; isLocating?: boolean; geoError?: string | null }`. Debounced (~300ms) input that queries `/api/geocoding?q=` as the user types; render a dropdown of results as "Municipality, Province" (`${name}, ${admin1}`); selecting one calls `onSelect` with an `ILocation`. A "Gamitin ang aking lokasyon" button calls `onUseMyLocation`. Show `geoError` (Filipino) inline when present. Loading = skeleton rows (not a spinner); empty query/no results = helpful Filipino suggestion ("Maghanap ng lungsod o bayan sa Pilipinas"). Tailwind only; semantic tokens (`bg-card`, `text-text`, `border-teal`, `text-text-muted`) so it works in light/dark. Mobile-first (full width at 375px). No `any`, no inline styles.
      Files: `src/components/common/LocationSearch.tsx`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 15. Create the `WeatherCard` component (functional; client only if it holds no state — make it a presentational component taking data as props, no `"use client"` needed).
      `src/components/weather/WeatherCard.tsx`: export `interface IWeatherCardProps { data: IWeatherData }`. Render large temperature (`text-5xl`+), condition via `describeWeather(current.weatherCode)` → "label emoji" in Filipino, humidity %, rain chance %, wind speed km/h, location name, and attribution text `Ayon sa ${data.source === "PAGASA" ? "PAGASA" : "Open-Meteo"}` (REQUIRED). Use semantic tokens (`bg-card`, `text-text`, `text-text-muted`, `text-teal` accents); DO NOT use `bg-alert` (emergency only). Mobile-first. No `any`, no inline styles.
      Files: `src/components/weather/WeatherCard.tsx`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 16. Create the `ForecastStrip` component (presentational).
      `src/components/weather/ForecastStrip.tsx`: export `interface IForecastStripProps { days: IForecastDay[] }`. Horizontally scrollable strip (`flex overflow-x-auto gap-3`, each cell `shrink-0`), each day showing `formatFilipinoShortDay(day.date)`, `describeWeather(day.weatherCode).emoji`, high/low (`${highC}°/${lowC}°`), and rain `${rainChance}%`. Horizontal scroll MUST work at 375px. Semantic tokens for light/dark. No `any`, no inline styles.
      Files: `src/components/weather/ForecastStrip.tsx`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 17. Update the weather and common component barrels.
      `src/components/weather/index.ts`: replace `export {}` with `export { default as WeatherCard } from "@/components/weather/WeatherCard"; export type { IWeatherCardProps } ...` and the same for `ForecastStrip`. `src/components/common/index.ts`: ADD (keep existing ThemeProvider/ThemeToggle exports) `export { default as LocationSearch } from "@/components/common/LocationSearch"; export type { ILocationSearchProps } ...`. (If LocationSearch is `"use client"` with a default export, export its default; keep the named-props type export.)
      Files: `src/components/weather/index.ts`, `src/components/common/index.ts`
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 18. Create a client container that composes location + weather, then wire it into the home dashboard.
      Create `src/components/weather/WeatherPanel.tsx` (`"use client"`, export `interface IWeatherPanelProps { className?: string }`) that uses `useLocation` + `useWeather`, renders `LocationSearch` (passing `onSelect`/`onUseMyLocation`/`geoError`/`isLocating`), then `WeatherCard` and `ForecastStrip`. Loading = skeleton loaders; error = Filipino message + a retry button calling `refetch`; empty = Filipino suggestion. Add it to the weather barrel. Then edit `src/app/page.tsx` to render the weather feature at the top (LocationSearch+GPS) with WeatherCard + ForecastStrip below, mobile-first, keeping the existing `ChatWidget` (place the panel above or beside it; keep `bg-app-bg` wrapper). Do NOT edit `layout.tsx`.
      Files: `src/components/weather/WeatherPanel.tsx` (create), `src/components/weather/index.ts` (update), `src/app/page.tsx` (modify)
      Verify: `npm run build` succeeds; `npm run dev` → home page shows LocationSearch + GPS button, WeatherCard, and a scrollable 7-day ForecastStrip in Filipino with "Ayon sa Open-Meteo" attribution; searching "Calamba" lists PH results and selecting one updates the weather.

- [ ] 19. Final full verification pass.
      Run the complete build and lint; fix any strict-mode/type/lint issues surfaced. Confirm no `any`, no `console.log`, no inline styles were introduced, the AGENTS.md managed block is untouched, and `PAGASA_API_KEY` is never referenced in any `"use client"` file (grep for `PAGASA_API_KEY` and confirm it only appears in server code: `src/lib/api/pagasa.ts` and `src/app/api/pagasa/route.ts`).
      Files: (none new — fixes only)
      Verify: `npm run build` AND `npm run lint` both pass with zero errors/warnings; dev smoke of `/`, `/api/weather`, `/api/geocoding` all behave as described.

## Open items marked "needs verification during implementation"

- Exact PAGASA TenDay response field names and mapping into `IWeatherData` — cannot verify without a live `PAGASA_API_KEY`. The null-returning silent fallback MUST be airtight so the Open-Meteo default path is never affected. (Item 9)
- Open-Meteo exact `current`/`daily` field availability (e.g. `precipitation_probability` in `current`) — confirm field names against a live response during item 8's dev smoke; adjust the param list if a field is unavailable, keeping `timezone=Asia/Manila`.
- Whether the Open-Meteo Geocoding API honors a `countryCode=PH` query param — regardless, the in-code `country_code === "PH"` filter is the authoritative guarantee. (Item 7)
