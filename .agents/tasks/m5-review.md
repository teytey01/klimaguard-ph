# Agricultural advisory (M5) with silent chat detection and live-weather derivation

M5 adds a climate-smart farming advisory for KlimaGuard PH. A pure derivation layer (`src/lib/agriculture/advisory.ts`) turns the normalized Open-Meteo fields into per-crop planting, spray-window, pest, and ENSO guidance; a static data module (`cropData.ts`) holds four common PH crop profiles plus a deterministic offline seed. The advisory surfaces three ways: a presentational `CropAdvisoryCard`, a live `AgriculturePanel` wired to `useLocation`/`useWeather`, and a silent chat branch in `quickClient.ts` that detects agricultural keywords and attaches a `crop` embed to the reply. A `GET /api/agriculture` route handler derives advisories from live weather for the selected location. The implementation is location-agnostic (the brief's "Region VIII" framing was dropped in favor of nationally relevant crops with live per-location weather), which is a reasonable reinterpretation documented in the plan.

Watch for: nothing blocking. (likely) The lint evidence in the plan references three "unused symbol" warnings for transparency helpers that are now actually wired up, so the recorded lint snapshot slightly predates the final tree — the M5 code itself introduces no warnings. (possible) The chat demo path uses a hardcoded seed so planting/spray text in chat does not reflect the user's real location, which is a documented demo tradeoff, not the live `/api/agriculture` behavior.

**Verdict**: APPROVED

## High-level view

The design splits cleanly: `cropData.ts` holds static agronomic thresholds and `advisory.ts` holds pure, side-effect-free derivation that runs identically on the server (chat path) and client (panel). This is the right seam — the same functions back the deterministic chat embed and the live weather-driven card, so behavior can't drift between surfaces.

Chat detection is additive and ordered. `detectIntent` checks weather first, then agri keywords, then transparency, then falls through to general. The existing M1 weather branch and generic fallback are untouched, so M1 keyword behavior stays intact. Agri detection selects the most relevant crop from the message and builds an advisory from the offline seed, returning a Filipino reply plus a `crop` embed that matches the long-standing `ICropEmbedData` contract.

The requirement coverage is complete: suitability with Filipino labels (Mainam / Mag-ingat / Huwag muna), planting verdict from forecast rain probability, spray window from wind + rain, humidity-driven pest triggers (rice-blast for palay, generic fungal watch otherwise), and El Niño / La Niña warnings gated behind a configurable ENSO phase. Source attribution ("Ayon sa DA / PhilRice / Open-Meteo") rides on every output — card, chat embed, and API payload.

Conventions hold: Next.js 16 `route.ts` with a named `GET` export, the stale `api/agriculture/index.ts` placeholder deleted, all new interfaces `I`-prefixed in `src/types/index.ts` with existing types preserved, one component per file with exported props, the component barrel updated, and theme tokens used throughout with caution rendered in amber (`#B7791F`) rather than the emergency `bg-alert`. No `any`, no `console.log`, and `layout.tsx` / the AGENTS.md managed block are not in the diff.

The one caveat worth noting is the chat seed: because `buildReply` is synchronous with no weather access, the chat embed's advisory is derived from a fixed mild-weather seed, so chat planting/spray lines are deterministic rather than location-accurate. The live route and panel use real Open-Meteo data. This is documented and acceptable for the demo path.

<details>
<summary>Issues (2)</summary>

1. **Stale lint snapshot** (likely, non-blocking) — the plan's recorded lint evidence lists three unused-symbol warnings for transparency helpers that the final tree now actually uses; the snapshot predates the final state. No action required for M5; re-running lint would show the warnings resolved.
2. **Chat embed uses fixed seed** (possible, by design) — the chat agri embed derives from `DEMO_ADVISORY_INPUT`, not the user's live location, so chat planting/spray text is deterministic rather than location-accurate. Documented demo tradeoff; the live `/api/agriculture` route and `AgriculturePanel` use real weather.

</details>

<details>
<summary>Details</summary>

## Derivation layer: one pure engine, two surfaces

The split between `cropData.ts` (static profiles + thresholds) and `advisory.ts` (pure functions over normalized weather fields) is the load-bearing decision. Every derivation function takes `ICurrentWeather` / `IForecastDay[]` — the same shapes `/api/weather` already produces — rather than raw Open-Meteo responses, so the identical logic backs the server chat path and the client panel.

Each required signal maps to a function. `deriveSprayWindow` grades on wind + rain (`ideal` under 15 km/h and 30% rain, `marginal` to 25 km/h and 50%, else `avoid`). `derivePlanting` looks at the max rain probability over the next three forecast days against a per-crop `heavyRainChance`, producing the "Okay na magtanim" / "Hintayin — malakas ang ulan" lines the brief asks for verbatim. `derivePestWarnings` fires rice-blast for palay at humidity ≥ 85 and a generic fungal watch for other crops at ≥ 90. `deriveEnsoWarning` returns `undefined` on a neutral phase so the card only shows ENSO text when relevant, with distinct El Niño (drought) and La Niña (flooding) Filipino messages. `deriveSuitability` composes these into good/caution/bad, and `buildAction` turns the verdict into a single concrete Filipino action line. The tone across all strings is practical farmer-to-farmer Filipino, matching the brief.

## Silent chat detection stays additive

`detectIntent` is ordered weather → agri → transparency → general. Agri matches against a sixteen-keyword set (`palay`, `tanim`, `niyog`, `coconut`, `peste`, `rice`, `farm`, `harvest`, etc.) covering both Filipino and English, and `pickCropId` routes `niyog`/`coconut` to coconut, `gabi`/`kamote`/`gulay` to root crops, and defaults to palay. The weather branch is checked first and unchanged, and the general fallback is preserved, so M1's existing keyword behavior is intact.

The embed is built from the same advisory engine via `buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT)`, and `embedForMessage` is shared between the deterministic demo path and the live-LLM path — so the crop card appears whether the reply text came from the seed replies or from Gemini. The returned `IChatResponse` carries a Filipino reply, a fitting suggestion ("Okay bang magtanim ng palay ngayon?"), and a `crop` embed whose `{ crop, advice, source }` shape matches the pre-existing `ICropEmbedData`. `EmbedCard`'s crop branch renders it unchanged, with source attribution.

The seed is the one behavioral caveat. Because `buildReply` is synchronous and has no weather access, the chat advisory is derived from a fixed mild-weather `DEMO_ADVISORY_INPUT` rather than the user's location. The reply is therefore deterministic and offline-safe, but its planting/spray specifics won't reflect real conditions in chat. The plan documents this explicitly and routes real-weather derivation through `/api/agriculture` and `AgriculturePanel`.

## API route and conventions

`src/app/api/agriculture/route.ts` is a proper Next.js 16 handler: `export const revalidate = 900` for the 15-minute cache floor, a named `GET`, location resolution from query params with env-driven defaults (reusing the `weather/route.ts` pattern), and a try/catch that degrades to a Filipino 503 message. The stale `src/app/api/agriculture/index.ts` placeholder was deleted, confirmed absent on disk. Attribution rides the payload via `AGRI_SOURCE`.

Type and structure conventions hold: the M5 interfaces are appended under a clearly marked section in `src/types/index.ts` with all existing chat/weather/transparency types preserved, every interface is `I`-prefixed, `ICropProfile` picked up a `shortName` field that is reflected in both the type and the data, and the `IMessageEmbed` crop variant / `ICropEmbedData` contract is unchanged. Components are one-per-file with exported `IXxxProps`, and both the `components/agriculture` and `lib/agriculture` barrels re-export named symbols.

## Styling and caution color

`CropAdvisoryCard` maps good → `border-teal text-teal`, caution → amber `#B7791F`, and bad → muted text; `bg-alert` is never used for crop advice, and pest-warning chips also use the amber border, keeping emergency red reserved for actual emergencies. The card and panel use semantic theme tokens (`bg-card`, `text-text`, `text-text-muted`, `bg-surface-2`, `bg-app-bg`, `border-teal`) that all resolve in `globals.css`, with no inline styles and no CSS modules. The panel mirrors `WeatherPanel`'s skeleton loader, Filipino error + "Subukan ulit" retry, and empty-state suggestion.

## Verification evidence

Per instruction, lint and build suites were not re-run; the plan's recorded evidence was read instead. The plan records `npm run lint` → exit 0 (0 errors) and `npm run build` → exit 0 with `/agriculture` and `/api/agriculture` present and a clean strict typecheck. One discrepancy: the plan notes three unused-symbol lint warnings for transparency helpers (`getTransparencyData`, `toTransparencyEmbed`, `detectProvince`), but the current working tree wires all three into the transparency intent branch, so those warnings would now be resolved. This means the lint snapshot slightly predates the final tree; it does not implicate M5, whose code introduces no warnings. No spot-check type-check was warranted — hook contracts, barrels, and theme tokens all resolve by inspection.

</details>

<details>
<summary>File map</summary>

Committed in `cycle-4: M5 agricultural advisory` (`66c48da`) plus the uncommitted chat-wiring working tree. Reproduce with `git diff af031cb..66c48da` (committed agriculture lib/components/route) and `git diff` (uncommitted chat wiring + types).

- `src/lib/agriculture/cropData.ts` — new: four PH crop profiles, `AGRI_SOURCE`, demo ENSO phase, offline seed.
- `src/lib/agriculture/advisory.ts` — new: pure derivation (spray, planting, pest, ENSO, suitability, action, composers).
- `src/lib/agriculture/index.ts` — new: barrel re-exporting functions, consts, and M5 types.
- `src/components/agriculture/CropAdvisoryCard.tsx` — new: presentational card, exported props, amber caution.
- `src/components/agriculture/AgriculturePanel.tsx` — new: client panel on `useLocation`/`useWeather` with skeleton/error/empty.
- `src/components/agriculture/index.ts` — updated: named re-exports of card + panel and their props.
- `src/app/api/agriculture/route.ts` — new: Next.js 16 `GET` + `revalidate`, Filipino 503 fallback.
- `src/app/api/agriculture/index.ts` — deleted stale placeholder.
- `src/app/agriculture/page.tsx` — new: server page rendering the panel.
- `src/types/index.ts` — appended M5 interfaces; existing types preserved.
- `src/lib/agent/quickClient.ts` — added agri keywords, `pickCropId`, additive agri intent branch + embed.

</details>
