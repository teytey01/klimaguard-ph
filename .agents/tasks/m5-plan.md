# M5 Agricultural Advisory — Implementation Plan

Climate-smart farming advisory for KlimaGuard PH. Auto-activates from chat context (silent
Farmer-role detection), renders a `CropAdvisoryCard` (crop + climate suitability + action),
and derives planting / spray-window / pest / El Niño–La Niña guidance from the existing
Open-Meteo weather fields. Demo geography: Eastern Visayas (Region VIII); crops: rice (palay),
coconut (niyog), root crops (gabi/kamote).

## Design decisions (rationale, 1–2 sentences each)

- **Static agronomic data module, pure derivation lib, thin API route, one card.** The brief
  allows hardcoded crop-calendar/threshold data for the demo, so crop definitions live in
  `src/lib/agriculture/cropData.ts` and all suitability math in a pure
  `src/lib/agriculture/advisory.ts` with no React/fetch. This keeps the logic unit-reasoned,
  reusable by both the chat path (server) and the card (client), and matches the existing
  `lib/api` + `lib/utils` separation.
- **Derivation runs off `ICurrentWeather` + `IForecastDay[]` already produced by `/api/weather`.**
  The task mandates deriving planting/spray/pest from `temperatureC, weatherCode, humidity,
  rainChance, windSpeedKmh` and `forecast[].rainChance`. The advisory functions take those as
  inputs (not raw API shapes) so they work identically on client (via `useWeather`) and server.
- **New types extend the file, reuse the chat embed contract.** New `I`-prefixed interfaces are
  appended to `src/types/index.ts`; the existing `ICropEmbedData { crop; advice; source }` and the
  `crop` embed variant are kept working. The chat path populates that existing embed from advisory
  output, so `EmbedCard`'s crop rendering continues to work unchanged.
- **El Niño/La Niña is a static demo signal, not a live ENSO feed.** No ENSO data source is wired in
  the repo. A single configurable phase constant (default `neutral`) in `cropData.ts` drives the
  warning text; this is honest for a demo and leaves one obvious seam for a real feed later.
- **Caution color.** Per conventions, `bg-alert` (#E53E3E) is EMERGENCY ONLY. Caution uses the amber
  arbitrary value `text-[#B7791F]` / `border-[#B7791F]`; good uses `teal`; bad uses `text-text-muted`
  (never alert red for crop advice).
- **Surface in UI via an agriculture page + reuse on home is out of scope beyond the card + chat.**
  The brief says the advisory "auto-activates from chat context," so the primary surface is the chat
  embed. A standalone `CropAdvisoryCard` is also exported and demoed on a new `src/app/agriculture/page.tsx`
  (optional surface) driven by `useWeather`/`useLocation`, following `WeatherPanel`'s skeleton/error/empty
  pattern. This proves the card renders live weather without touching the home layout or `layout.tsx`.

## Data model (append to `src/types/index.ts`)

```ts
// === M5 Agriculture ===
export type ICropSuitability = "good" | "caution" | "bad";
export type IPlantingVerdict = "go" | "wait";
export type ISprayVerdict = "ideal" | "marginal" | "avoid";
export type IEnsoPhase = "el-nino" | "la-nina" | "neutral";

export interface ICropProfile {
  id: string;                 // "palay" | "niyog" | "gabi" | "kamote"
  name: string;               // Filipino display name, e.g. "Palay (bigas)"
  emoji: string;
  idealTempC: { min: number; max: number };
  // crop-specific thresholds used by the derivation lib
  heavyRainChance: number;    // rainChance above which planting is risky
  blastHumidity?: number;     // rice-blast humidity trigger (palay only)
  source: string;             // e.g. "Ayon sa DA / PhilRice / Open-Meteo"
}

export interface IAdvisoryInput {
  current: ICurrentWeather;
  forecast: IForecastDay[];
  ensoPhase: IEnsoPhase;
}

export interface ICropAdvisory {
  crop: string;               // display name
  emoji: string;
  suitability: ICropSuitability;
  suitabilityLabel: string;   // Filipino: "Mainam" / "Mag-ingat" / "Huwag muna"
  action: string;             // one actionable Filipino line
  planting: { verdict: IPlantingVerdict; message: string };
  spray: { verdict: ISprayVerdict; message: string };
  pestWarnings: string[];     // e.g. "Mataas ang humidity — bantayan ang blast sa palay"
  ensoWarning?: string;       // present only when phase != neutral and relevant
  source: string;             // attribution — REQUIRED
}
```

Keep existing chat/weather types intact; only append.

## Advisory derivation logic (`src/lib/agriculture/advisory.ts`, pure functions)

- `deriveSprayWindow(current)`: `ideal` when `windSpeedKmh < 15` AND `rainChance < 30`; `marginal`
  when `windSpeedKmh <= 25` AND `rainChance < 50`; otherwise `avoid`. Filipino messages, e.g. ideal:
  "Mainam mag-spray — mahina ang hangin at mababa ang tsansa ng ulan." / avoid: "Iwas muna sa
  pag-spray — malakas ang hangin o malaki ang tsansa ng ulan."
- `derivePlanting(crop, input)`: look at next-3-days max `forecast[].rainChance`. `wait` when any of
  the next 3 days exceeds `crop.heavyRainChance` (default 70) → "Hintayin — malakas ang ulan sa mga
  susunod na araw." Else `go` → `Okay na magtanim ng ${cropShortName}.` (e.g. "Okay na magtanim ng
  palay.").
- `derivePestWarnings(crop, current)`: palay + `humidity >= crop.blastHumidity` (default 85) →
  "Mataas ang humidity — bantayan ang blast sa palay." Generic high-humidity (`>= 90`) → fungal-watch
  line for coconut/root crops. Returns `[]` when none.
- `deriveSuitability(crop, input)`: `bad` if planting verdict is `wait` AND temp outside ideal; else
  `caution` if any pest warning OR planting `wait` OR spray `avoid`; else `good`. Map to Filipino
  `suitabilityLabel` and a single `action` line.
- `deriveEnsoWarning(crop, phase)`: static per-phase Filipino text; `el-nino` → tubig/tagtuyot caution,
  `la-nina` → sobrang ulan/baha caution; `neutral` → `undefined`.
- `buildCropAdvisory(crop, input): ICropAdvisory` composes the above and attaches `crop.source`.
- `buildAdvisoriesForRegion8(input): ICropAdvisory[]` runs `buildCropAdvisory` over the Region VIII
  crop set from `cropData.ts`.

All functions are pure (no fetch, no `console.log`). Tone: practical, direct, farmer-to-farmer Filipino.

## Chat detection logic (`src/lib/agent/quickClient.ts`)

- Add an agri keyword set: `palay, bigas, tanim, magtanim, ani, saka, bukid, niyog, coconut, gulay,
  pananim, peste, pest, rice, farm, planting, harvest`.
- In `buildReply`, add an agri branch (check order: keep weather branch intact; agri can be checked
  before the generic fallback). On match, pick the most relevant crop (palay default; `niyog/coconut`
  → coconut; `gulay/gabi/kamote` → root crop) and build an `ICropEmbedData` from a representative
  advisory. Because `buildReply` is synchronous and has no live weather, use a small static
  `IAdvisoryInput` seed (neutral ENSO + mild demo weather from `cropData.ts`) so the demo path stays
  deterministic and offline — document this seed in a comment. Return `IChatResponse` with a practical
  Filipino `reply`, a relevant `suggestion` (e.g. "Okay bang magtanim ng palay ngayon?"), and
  `embed: { kind: "crop", data: { crop, advice, source } }` where `advice` = suitabilityLabel + action.
- Do NOT break the existing weather branch or generic fallback; this is additive.

## Files to create / modify

Create:
- `src/lib/agriculture/cropData.ts` — Region VIII crop profiles (`ICropProfile[]`), the demo ENSO phase
  constant, the deterministic demo `IAdvisoryInput` seed, and source strings. camelCase util module.
- `src/lib/agriculture/advisory.ts` — pure derivation functions above.
- `src/lib/agriculture/index.ts` — barrel re-exporting the public functions/consts + types.
- `src/components/agriculture/CropAdvisoryCard.tsx` — presentational card (NO `use client`), props
  `ICropAdvisoryCardProps { advisory: ICropAdvisory }` exported in-file. Renders crop + emoji,
  suitability badge (good=teal, caution=`text-[#B7791F]`, bad=muted), action, planting line, spray
  indicator, pest warnings, optional ENSO warning, and `Ayon sa ...` attribution (REQUIRED). Uses
  theme tokens `bg-card text-text text-text-muted border-teal`.
- `src/app/api/agriculture/route.ts` — `export const revalidate = 900;` + `GET(request: Request)`:
  resolve location from query (reuse the `resolveLocation` approach from `weather/route.ts`), call the
  Open-Meteo client, run `buildAdvisoriesForRegion8`, return `NextResponse.json({ advisories, source,
  fetchedAt })`; try/catch → Filipino error `{ error }` with 503. (Define `IAgricultureResponse` in
  types.)
- `src/components/agriculture/AgriculturePanel.tsx` (`use client`) — reuses `useLocation` + `useWeather`,
  maps live `data.current`/`data.forecast` into `IAdvisoryInput` (neutral ENSO), calls
  `buildAdvisoriesForRegion8`, and renders `CropAdvisoryCard`s with WeatherPanel-style skeleton / error
  (Filipino + retry) / empty states. Props `IAgriculturePanelProps { className?: string }`.
- `src/app/agriculture/page.tsx` — server component rendering `<AgriculturePanel />` inside the same
  layout wrapper style as other pages. (Optional demo surface; does not alter home or layout.tsx.)

Modify:
- `src/types/index.ts` — append the M5 types above (do NOT remove existing types).
- `src/lib/agent/quickClient.ts` — add agri keyword detection + embed population (additive).
- `src/components/agriculture/index.ts` — replace `export {}` with named re-exports of
  `CropAdvisoryCard`, `AgriculturePanel`, and their props types.
- Delete `src/app/api/agriculture/index.ts` (stale inert placeholder) after creating `route.ts`.

Do NOT edit `src/app/layout.tsx` or the `AGENTS.md` managed block.

## Implementation steps (ordered by dependency; each leaves the tree buildable)

- [ ] 1. Append M5 types to `src/types/index.ts` (section "=== M5 Agriculture ===": `ICropSuitability`,
      `IPlantingVerdict`, `ISprayVerdict`, `IEnsoPhase`, `ICropProfile`, `IAdvisoryInput`, `ICropAdvisory`,
      `IAgricultureResponse`). Keep all existing chat/weather types.
      Files: `src/types/index.ts`
      Verify: `npm run lint` passes (no `any`, no unused), then `npm run build` compiles.

- [ ] 2. Create the static data module `src/lib/agriculture/cropData.ts`: Region VIII `ICropProfile[]`
      (palay, niyog, gabi, kamote) with thresholds + source strings, the demo `DEMO_ENSO_PHASE: IEnsoPhase`
      (`"neutral"`), and a deterministic `DEMO_ADVISORY_INPUT: IAdvisoryInput` for the offline chat path.
      Files: `src/lib/agriculture/cropData.ts`
      Verify: `npm run build` compiles (module imports resolve).

- [ ] 3. Create the pure derivation lib `src/lib/agriculture/advisory.ts` with `deriveSprayWindow`,
      `derivePlanting`, `derivePestWarnings`, `deriveEnsoWarning`, `deriveSuitability`, `buildCropAdvisory`,
      and `buildAdvisoriesForRegion8`, using the thresholds from `cropData.ts`. No fetch, no console.
      Files: `src/lib/agriculture/advisory.ts`
      Verify: `npm run build` compiles; `npm run lint` passes.

- [ ] 4. Create the agriculture barrel `src/lib/agriculture/index.ts` re-exporting the public functions,
      constants, and (re-exported) M5 types.
      Files: `src/lib/agriculture/index.ts`
      Verify: `npm run build` compiles; a `@/lib/agriculture` import resolves.

- [ ] 5. Create `src/components/agriculture/CropAdvisoryCard.tsx` (presentational, no `use client`) with
      `ICropAdvisoryCardProps` exported in-file. Render crop/emoji, suitability badge (teal / `#B7791F` /
      muted — never `bg-alert`), action, planting + spray indicators, pest warnings, optional ENSO warning,
      and required `Ayon sa ...` attribution, using theme tokens. Mobile-first (375px).
      Files: `src/components/agriculture/CropAdvisoryCard.tsx`
      Verify: `npm run build` compiles; `npm run lint` passes.

- [ ] 6. Create `src/components/agriculture/AgriculturePanel.tsx` (`use client`) that maps live
      `useWeather` data into `IAdvisoryInput`, calls `buildAdvisoriesForRegion8`, and renders
      `CropAdvisoryCard`s with skeleton / Filipino error+retry / empty states mirroring `WeatherPanel`.
      Files: `src/components/agriculture/AgriculturePanel.tsx`
      Verify: `npm run build` compiles; `npm run lint` passes.

- [ ] 7. Replace `src/components/agriculture/index.ts` `export {}` with named re-exports of
      `CropAdvisoryCard` + `AgriculturePanel` and their prop types.
      Files: `src/components/agriculture/index.ts`
      Verify: `npm run build` compiles; `@/components/agriculture` imports resolve.

- [ ] 8. Create the API route `src/app/api/agriculture/route.ts` (`export const revalidate = 900;` +
      `GET`), reusing the `resolveLocation` pattern and the Open-Meteo client, returning
      `IAgricultureResponse` via `NextResponse.json`, with try/catch → Filipino 503 error. Then delete the
      stale `src/app/api/agriculture/index.ts`.
      Files: `src/app/api/agriculture/route.ts`, remove `src/app/api/agriculture/index.ts`
      Verify: `npm run build` compiles and reports the `/api/agriculture` route; `npm run lint` passes.

- [ ] 9. Create `src/app/agriculture/page.tsx` rendering `<AgriculturePanel />` in the shared page wrapper
      style (do NOT edit `layout.tsx`).
      Files: `src/app/agriculture/page.tsx`
      Verify: `npm run build` compiles and lists the `/agriculture` route.

- [ ] 10. Wire agri detection into `src/lib/agent/quickClient.ts`: add the keyword set and an additive agri
      branch in `buildReply` that selects the relevant crop, builds an advisory from `DEMO_ADVISORY_INPUT`,
      and returns `IChatResponse` with a Filipino reply, a relevant `suggestion`, and a `crop` embed
      (`ICropEmbedData` from advisory output). Keep the weather branch and generic fallback intact.
      Files: `src/lib/agent/quickClient.ts`
      Verify: `npm run build` compiles; `npm run lint` passes.

- [ ] 11. Final verification pass.
      Verify: `npm run lint` (clean) AND `npm run build` (successful production build, `/agriculture` and
      `/api/agriculture` present, no type errors). Confirm `EmbedCard` still renders the `crop` embed and the
      existing weather chat branch is unchanged.

## Verification commands (project-real)

- `npm run lint` — ESLint 9 / `eslint-config-next` (core-web-vitals + typescript). Must be clean
  (no `any`, no `console.log`, no unused symbols).
- `npm run build` — `next build` production compile; must succeed with the new `/agriculture` page and
  `/api/agriculture` route handler present and no TypeScript errors.

No test runner is configured; the brief does not request adding one, so verification is lint + build.
If a test runner is later desired, add Vitest and a `test` script before writing unit tests for
`advisory.ts` (its pure functions are the natural first target).

## Verification note (M5, recorded so the reviewer need not re-run)

Commands run from the project root on the final M5 tree:

- `npm run lint` → exit 0. **0 errors, 3 warnings.** All 3 warnings are in
  `src/lib/agent/quickClient.ts` and belong to an UNTRACKED, in-progress M11
  (transparency) effort that shares this file, NOT to M5:
  - `10:3 'getTransparencyData' is defined but never used`
  - `11:3 'toTransparencyEmbed' is defined but never used`
  - `19:10 'detectProvince' is defined but never used`
  These transparency imports/helpers existed in the working tree before the M5
  edits (the whole `src/lib/transparency/` dir and the agent file are untracked
  parallel work) and are not yet wired into `buildReply`. The M5 additions
  (agri keyword set, `pickCropId`, the agri branch) introduce **zero** new lint
  warnings. Per the "do not break other modules" rule the M11 dead code was left
  untouched rather than deleted; M11 will consume those symbols when it wires its
  own `buildReply` branch.
- `npm run build` → exit 0. Production build succeeded (Next.js 16.3.8, Turbopack).
  TypeScript strict typecheck finished with no errors. Route list includes the new
  `○ /agriculture` page and `ƒ /api/agriculture` route handler alongside the
  existing routes.

Correctness checklist confirmed: no `any`, no `console.log`, no inline styles in
M5 files; all user-facing text Filipino-first; `Ayon sa DA / PhilRice / Open-Meteo`
attribution on every advisory output (card + chat embed + API `source`); `bg-alert`
NOT used for caution (caution uses `#B7791F`, good uses `teal`, bad uses muted);
`AGENTS.md` managed block and `src/app/layout.tsx` untouched. Per the pre-finish
correction, the module is location-agnostic: no "Region VIII"/"Region8"/"Eastern
Visayas" naming remains (`buildCropAdvisories` + `PH_CROPS`); the crop list is
nationally relevant and advisories derive from live Open-Meteo for the selected
location (default Calamba, Laguna from `.env.local`).

The stale `src/app/api/agriculture/index.ts` placeholder was deleted; the handler
lives at `src/app/api/agriculture/route.ts`.

## Notes / assumptions

- ENSO phase is a static demo constant (`neutral` default); no live ENSO feed exists in the repo. Flip
  `DEMO_ENSO_PHASE` to exercise El Niño/La Niña warning text.
- The chat demo path (`buildReply`) is synchronous with no weather access, so it uses a deterministic
  seed input; the live `/api/agriculture` route and `AgriculturePanel` use real Open-Meteo data.
- Attribution (`Ayon sa DA / PhilRice / Open-Meteo`) is rendered on every advisory output (card + embed),
  per the mandatory source-attribution rule.
