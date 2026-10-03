# M2 Weather + M8 Location Intelligence — real-time PH weather wired into the home dashboard

This change adds the full weather/location feature: three App Router route handlers (`geocoding`, `weather`, `pagasa`) backed by typed lib clients, two client hooks (`useLocation`, `useWeather`), a `LocationSearch` with autocomplete + GPS, presentational `WeatherCard` and `ForecastStrip`, a `WeatherPanel` container, and the WMO→Filipino and Filipino-date utilities. The Open-Meteo baseline is the working default; PAGASA is attempted first only when a key is present and returns `null` otherwise so the fallback is silent. All route handlers set `revalidate = 900` and every upstream `fetch` passes `next.revalidate = 900`; `useWeather` adds a 15-minute module-level client cache. Types are I-prefixed with no `any`, components are one-per-file with exported props interfaces, and all user-facing copy is Filipino with skeleton loaders, a Filipino error+retry, and a Filipino empty state.

Watch for: the geocoding client drops otherwise-valid PH results whose `admin1` (province) is absent, narrowing results beyond the "country_code === PH only" requirement (confirmed). The PAGASA mapping is a deliberate `null` stub pending a live key (confirmed, acknowledged in the plan). `layout.tsx` was modified despite the plan's "do NOT edit layout" note, but the change is prior-cycle theme wiring, not M2 (confirmed, non-blocking).

**Verdict**: APPROVED

## High-level view

The server layer is clean. Each route handler is a thin, fully try/caught proxy over a typed lib client, returning normalized shapes that match the `IWeatherData`/`IGeocodingResponse` contracts in `src/types`. The weather handler resolves a location (query params with env-default fallback), tries PAGASA, then silently uses Open-Meteo. The Open-Meteo client unconditionally sets `timezone=Asia/Manila` and requests exactly the current fields and 7 daily days the spec calls for.

Caching is applied at both tiers the plan specified for the Cache-Components-off model: route segment `revalidate = 900` plus `next.revalidate` on each fetch, and a 15-minute keyed client cache in `useWeather` that `refetch` bypasses.

The PAGASA key is read only in `src/lib/api/pagasa.ts` (server lib) with the string also appearing in two server-file comments; no client component or `NEXT_PUBLIC_` path references it, and `fetchPagasaWeather` returns `null` on blank key or any failure, so the Open-Meteo-only default is airtight.

The one behavioral narrowing is in the geocoding filter: beyond `country_code === "PH"` it also requires `admin1` to be a present string, so a valid PH place with no province field is silently excluded rather than shown. This is a correctness edge, not a crash, and the UI degrades to its Filipino "no results" state.

The UI meets the surface requirements — large temperature, Filipino condition+emoji, humidity/rain/wind, source attribution ("Ayon sa Open-Meteo"/"Ayon sa PAGASA"), a horizontally scrollable 7-day strip with Filipino dates, debounced autocomplete rendering "Municipality, Province", a "Gamitin ang aking lokasyon" GPS button with Filipino permission-denied handling, and semantic theme tokens for light/dark. No `any`, no `console.log`, no inline styles (the one `dangerouslySetInnerHTML` theme script lives in the pre-existing `layout.tsx` change, not M2).

<details>
<summary>Issues (3)</summary>

1. **Geocoding drops provinceless PH results** — `fetchGeocoding` filters out hits where `admin1` is not a string, excluding valid PH places that lack a province. Consider keeping the result with an empty `admin1` (and rendering just the name) instead of discarding it.
2. **PAGASA mapping is a stub** — `fetchPagasaWeather` always returns `null` even when a key is set; the TenDay response is never mapped. Acknowledged as "needs verification during implementation" and safe (silent Open-Meteo fallback), but PAGASA attribution can never actually appear until this is completed.
3. **layout.tsx edited despite plan** — the diff touches `layout.tsx` (ThemeProvider + no-flash script + metadata), which plan item 18 said not to edit. The change is prior-cycle theme scaffolding, not M2, and is harmless; confirm it belongs in this commit rather than leaking in.

</details>

<details>
<summary>Details</summary>

## Server proxies and the PAGASA-first / Open-Meteo-fallback flow

`/api/weather` resolves an `ILocation` from `lat`/`lon`/`name`/`province` query params, falling back to the `NEXT_PUBLIC_DEFAULT_*` env values (with hardcoded Calamba/Laguna constants as a final guard), then runs `fetchPagasaWeather(location)` and uses `pagasa ?? await fetchOpenMeteoWeather(location)`. Because `fetchPagasaWeather` returns `null` whenever the key is blank, the default build path never calls PAGASA and always serves `source: "Open-Meteo"`. Any thrown error collapses to a 503 with the Filipino message `"Hindi makuha ang panahon ngayon. Pakisubukan ulit."`. The verification note records the build registering all four routes as dynamic handlers, consistent with this being `route.ts` with a named `GET`.

The Open-Meteo client sets `timezone=Asia/Manila` unconditionally, requests `current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`, and `forecast_days=7`, then zips `daily.time[i]` with the daily arrays into `IForecastDay[]`. Missing numeric fields coerce to `0` via `numberAt`, so a partial upstream response yields a renderable (if zeroed) card rather than a crash.

## Geocoding PH filter narrows on missing admin1

The in-code filter is the authoritative PH guarantee (the upstream `countryCode=PH` is only a hint), which is correct. The concern is the predicate also requires `typeof item.admin1 === "string"`:

```ts
.filter(
  (item): item is Required<IOpenMeteoGeoResult> =>
    item.country_code === "PH" &&
    typeof item.name === "string" &&
    typeof item.admin1 === "string" &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number",
)
```

Open-Meteo geocoding does not always populate `admin1` for every PH feature. Those rows are silently dropped, so a user searching a place whose province field is absent sees the "Walang nahanap" state even though a valid PH match existed. The requirement is "filter to Philippines ONLY (country_code === PH)"; the extra `admin1` gate is a stricter filter than specified. Not a crash and not blocking, but worth loosening — keep the hit with `admin1: ""` and let the display fall back to the bare name (`WeatherCard` and `LocationSearch` would then need to tolerate an empty province, which `WeatherCard` already does).

## PAGASA client is a safe stub, not a mapping

`fetchPagasaWeather` reads `process.env.PAGASA_API_KEY`, returns `null` immediately when blank, and on a set key issues the request but still returns `null` with a `// needs verification during implementation` marker instead of mapping the TenDay body. This is the airtight silent fallback the plan called for and keeps the Open-Meteo default unaffected. The practical consequence: `source: "PAGASA"` and the "Ayon sa PAGASA" attribution are currently unreachable regardless of key, because no PAGASA data is ever returned. That is acceptable for this cycle given the key is blank by default and the mapping cannot be verified without a live key, but it means the PAGASA path is wiring only.

## Client caching

`useWeather` keys a module-level `Map` by `lat,lon` with a 15-minute TTL and serves cached data without a network call on a hit; `refetch` forces a reload. The effect depends on the `location` object identity, and since `useLocation` only produces a new object through `setLocation`/`useMyLocation` it won't refetch on every render.

## UI surface and Filipino-first states

`WeatherCard` renders a large temperature (`text-5xl sm:text-6xl`), the Filipino condition+emoji from `describeWeather`, and humidity/rain/wind, with attribution computed as `source === "PAGASA" ? "Ayon sa PAGASA" : "Ayon sa Open-Meteo"`. `ForecastStrip` is a `flex overflow-x-auto` row of `w-24 shrink-0` cells (horizontal scroll holds at 375px) showing `formatFilipinoShortDay`, the emoji, high/low, and rain %. `LocationSearch` debounces at 300ms, aborts in-flight requests, renders results as `{name}, {admin1}`, shows skeleton rows while searching, a Filipino no-results line, and an empty-query hint, plus the "📍 Gamitin ang aking lokasyon" button. `useLocation` surfaces a Filipino permission-denied message. `WeatherPanel` composes these with skeleton loading, a Filipino error + "Subukan ulit" retry calling `refetch`, and a Filipino empty state. All of this uses the semantic theme tokens (`bg-card`, `text-text`, `text-text-muted`, `text-teal`, `bg-surface-2`) that flip with `.dark`, and `bg-alert` is correctly not used here.

The WMO map covers every required code (0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99) with `describeWeather` returning a Filipino `"Hindi matukoy"` default for anything else; 0/61/95 match the spec exactly. `dateFilipino.ts` hand-rolls the day/month arrays (no `fil` locale in date-fns) and `formatFilipinoDate` produces "Biyernes, Oktubre 3" form, guarding invalid input.

## Bundled layout change

`layout.tsx` was modified to wire `ThemeProvider`, a no-flash theme `<script>`, and KlimaGuard metadata. Plan item 18 explicitly said not to edit `layout.tsx` for M2, and `ThemeProvider` is described as pre-existing — so this is prior-cycle theme scaffolding present in the working tree, not part of the weather feature. It preserves the Geist fonts and does not break the root layout. Non-blocking, but it should be confirmed that this belongs in the same commit and isn't an accidental carry-in. The managed `<!-- BEGIN:nextjs-agent-rules -->`/`END` block in `AGENTS.md` is intact.

## Verification evidence

The coder's note records `npm run build` (exit 0, Turbopack, strict typecheck, all four API routes registered) and `npx eslint .` (0 errors/0 warnings), with greps confirming no `: any`/`as any`/`<any>`/`any[]` and no `console.log` under `src`. A spot-check grep for `PAGASA_API_KEY` confirms it appears only in `src/lib/api/pagasa.ts` (the actual read) and server-file comments — no client/`NEXT_PUBLIC_` exposure. The build/lint suites were not re-run per instructions; the evidence is present and specific.

</details>

<details>
<summary>File map</summary>

- `src/types/index.ts` — appended M2 types (`ILocation`, `IGeocodingResult`, `IGeocodingResponse`, `IWeatherSource`, `ICurrentWeather`, `IForecastDay`, `IWeatherData`); chat types preserved.
- `src/lib/utils/weatherCodes.ts` — WMO→Filipino map (all required codes) + `describeWeather`.
- `src/lib/utils/dateFilipino.ts` — hand-rolled Filipino day/month arrays + `formatFilipinoDate`/`formatFilipinoShortDay`.
- `src/lib/api/geocoding.ts` — Open-Meteo geocoding client, PH filter (also gates on `admin1`).
- `src/lib/api/weather.ts` — Open-Meteo forecast client, always `timezone=Asia/Manila`, 7 days.
- `src/lib/api/pagasa.ts` — server-only PAGASA client; returns `null` (key read + safe stub).
- `src/app/api/geocoding/route.ts`, `weather/route.ts`, `pagasa/route.ts` — route handlers, `revalidate=900`, try/catch, Filipino fallbacks; stale `index.ts` placeholders deleted.
- `src/hooks/useLocation.ts` — selected-location state, env default, GPS + Filipino denial.
- `src/hooks/useWeather.ts` — client fetch with 15-min keyed cache, deferred effect fetch.
- `src/components/common/LocationSearch.tsx` — debounced autocomplete + GPS button.
- `src/components/weather/WeatherCard.tsx`, `ForecastStrip.tsx`, `WeatherPanel.tsx` — presentational card/strip + container.
- `src/app/page.tsx` — home dashboard wires `WeatherPanel` beside `ChatWidget`.
- barrels (`lib/utils`, `lib/api`, `hooks`, `components/weather`, `components/common`) — updated exports.
- `src/app/layout.tsx`, `src/app/globals.css` — prior-cycle theme wiring (bundled, non-M2).

Full diff: `git diff main` plus the untracked `route.ts`, component, hook, lib, and util files listed above.

</details>
