# Implementation Plan — M3 Hazard Alerts + M4 Safety Advisor (KlimaGuard PH)

All paths are absolute inside the worktree `c:\Users\Althea Kim Peria\Desktop\KlimaGuardPH\.worktrees\m3-m4-alerts`.
Step agents' cwd is the repo root, so always `cd` into the worktree or use absolute paths.

## Key design decisions (grounded in the worktree + Next.js 16 docs)

- **Framework / caching:** Next.js 16.3.8, Cache Components OFF (no `cacheComponents` flag in `next.config.ts`), so the "previous" caching model applies. Route handler GET defaults to dynamic in Next 16; to get the required 15-min cache we set `export const revalidate = 900` on the route segment and (when a real feed exists) use per-fetch `next: { revalidate: 900 }`. Source: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` and `.../03-api-reference/03-file-conventions/route.md`. `revalidate` must be a static literal (`900`, not `15 * 60`).
- **Route handler shape:** named `export async function GET()` returning `Response.json(...)`. No live NDRRMC/PAGASA endpoint is wired, so GET returns a well-typed mock payload with a `source` field (`"mock"`), structured so a real feed drops in later. All fetching logic wrapped in try/catch with a Filipino fallback message. `RouteContext` is a global generated helper (no import) — not needed here since the route is non-dynamic.
- **Layout reality vs prompt:** `src/app/layout.tsx` is still the create-next-app scaffold (Geist fonts, `LayoutProps<"/">`, no ThemeProvider, no no-flash script). The AlertBanner mounts as the first child inside `<body>`, above `{children}`. Keep this edit minimal/additive — a concurrent M2+M8 branch edits the same file and the orchestrator merges later.
- **Dark mode:** `globals.css` currently uses `@media (prefers-color-scheme: dark)` with no `.dark` class variant and no `@custom-variant`. New non-emergency components use Tailwind's default `dark:` variant (prefers-color-scheme driven), which works today without the toggle wiring. The AlertBanner and hotline buttons deliberately do NOT get darkened `dark:` variants — Alert Red `#E53E3E` with white text stays constant in both themes (WCAG AA: #E53E3E on white text ≈ 4.0:1 for large/bold banner text; keep banner text ≥18px bold or use `text-white` on the solid red which is the required emergency styling). Do not alter `globals.css`'s theme block (concurrent branch may rewrite it).
- **Dismiss / reappear-on-worsening:** store the dismissed signal level in `localStorage` key `klimaguard:alertDismissedSignal` (number). Banner is hidden only when `currentSignalLevel <= dismissedSignalLevel`. When the current level exceeds the dismissed level (conditions worsened), clear/ignore the dismissal and re-show. Dismiss writes the current level; "no active hazard" renders nothing regardless.
- **Offline-first cache:** `useAlerts` reads `/api/alerts`, and on success writes the payload to `localStorage` key `klimaguard:lastAlertState` with a `cachedAt` timestamp. On fetch failure (offline/API error) it falls back to the cached payload and surfaces a Filipino error + retry. 15-min client freshness convention via `cachedAt`.
- **No `any`, no `console.log`, Filipino-first, skeleton loaders, one component per file, props interfaces exported in same file, barrels updated, `@/` imports.** No test runner configured; verification is `npm run build` + `npm run lint` from the worktree.

## Ordered items

- [ ] 1. Add alert/safety types to `src/types/index.ts` (additive — keep existing `export {}` removal minimal; replace the placeholder body with the interfaces).
      Interfaces: `IHazardAlert { signalLevel: 1|2|3|4|5; typhoonName: string; affectedAreas: string[]; timestamp: string; severity: "advisory"|"warning"|"emergency" }`, `IEvacuationCenter { name: string; distance: string; capacity: string; directionsUrl: string }`, `IHotline { label: string; number: string; tel: string }`, `IAlertState { hasActiveHazard: boolean; alert: IHazardAlert | null; evacuationCenters: IEvacuationCenter[]; hotlines: IHotline[]; source: string; fetchedAt: string }`.
      Files: `src/types/index.ts`
      Verify: `cd` worktree; `npx tsc --noEmit` (or `npm run build`) — no type errors from the new interfaces.

- [ ] 2. Create the alerts API route handler returning a typed mock `IAlertState`, with `export const revalidate = 900` and try/catch Filipino fallback.
      GET assembles an `IAlertState` mock (one active signal-3 typhoon sample, 1-2 evacuation centers, hotlines 911 / Red Cross 143 / NDRRMC) with `source: "mock"`; structured so a real NDRRMC/PAGASA fetch drops in. On thrown error return a 200 with `hasActiveHazard: false`, empty arrays, and a Filipino `source: "fallback"` note (never a 500 that breaks the client).
      Files: `src/app/api/alerts/route.ts` (leave placeholder `src/app/api/alerts/index.ts` as-is).
      Verify: `npm run build` compiles the route; `npm run dev` then GET `http://localhost:3000/api/alerts` returns JSON matching `IAlertState` (manual/once).

- [ ] 3. Create `useAlerts` hook with 15-min client cache + localStorage offline fallback, and export it from the hooks barrel.
      `useAlerts()` returns `{ state: IAlertState | null; loading: boolean; error: string | null; refetch: () => void }`. Fetches `/api/alerts`; on success caches to `localStorage` `klimaguard:lastAlertState` with `cachedAt`; on failure loads cache and sets a Filipino `error`. No `console.log`.
      Files: `src/hooks/useAlerts.ts`, `src/hooks/index.ts` (add `export * from "./useAlerts";`, replace `export {}`).
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 4. Create `AlertBanner` component (full-width, Alert Red, pulsing icon, 911 button, dismiss/reappear-on-worsening) with exported props interface.
      Client component. Uses `useAlerts` (or accepts `state` prop). Renders `null` when no active hazard. Shows signal level badge, typhoon name, affected areas, timestamp (Filipino date via `date-fns`). `bg-[#E53E3E] text-white` constant in both themes; warning icon `animate-pulse`; "Tawagan ang 911" `tel:911` button `min-h-[44px] min-w-[44px]`. Dismiss logic per localStorage `klimaguard:alertDismissedSignal`; reappear when current level > dismissed. Full-width and legible at 375px.
      Files: `src/components/alerts/AlertBanner.tsx`, `src/components/alerts/index.ts` (add export).
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 5. Create `EvacuationCard` component with exported props interface.
      Client/server-safe presentational component: props `{ center: IEvacuationCenter }`. Filipino labels (Pangalan, Layo, Kapasidad, Direksyon), teal accents, `bg-white dark:bg-[#16263D]`, directions as a maps link. ≥44px touch targets on actionable links.
      Files: `src/components/alerts/EvacuationCard.tsx`, `src/components/alerts/index.ts` (add export).
      Verify: `npm run build` + `npm run lint` pass.

- [ ] 6. Mount `AlertBanner` in the root layout as the first child inside `<body>`, above `{children}` — minimal additive edit.
      Add `import { AlertBanner } from "@/components/alerts";` and render `<AlertBanner />` before `{children}`. Preserve Geist fonts, `LayoutProps<"/">`, html/body classes exactly.
      Files: `src/app/layout.tsx`
      Verify: `npm run build` passes; banner mounts on every route.

- [ ] 7. Build the alerts detail page `src/app/alerts/page.tsx` (full alert detail, EvacuationCard list, always-accessible hotlines, G07 priority, offline-first).
      Client page using `useAlerts`: skeleton loader while loading; Filipino error + retry button on error (falls back to cached state); helpful Filipino empty state when no active hazard; renders alert detail, maps over `evacuationCenters` with `EvacuationCard`, and a persistent hotlines list (911, Red Cross 143, NDRRMC (02) 8911-1406 / 911-5061) as `tel:` links with ≥44px targets. Safety info takes visual priority. Leave placeholder `src/app/alerts/index.ts` as-is.
      Files: `src/app/alerts/page.tsx`
      Verify: `npm run build` + `npm run lint` pass; `/alerts` renders loading→content→error states.

- [ ] 8. Final integration verification.
      Files: none (verification only).
      Verify: from the worktree, `npm run lint` and `npm run build` both succeed with no errors; confirm `/api/alerts`, every page's banner, and `/alerts` render. Clean up any temp files.

## Gaps / assumptions
- Real NDRRMC/PAGASA feed is not available; route returns a clearly-marked mock. `PAGASA_API_KEY` / `.env.local` absent in worktree — route must not depend on env.
- Dark-mode toggle wiring (`@custom-variant dark`, ThemeProvider) is owned by another branch; this feature only uses `dark:` variants that work under the current `prefers-color-scheme` setup and keeps emergency styling theme-constant.
- Shared files (`layout.tsx`, `types/index.ts`, barrels) are edited by a concurrent branch; keep all edits additive to minimize merge conflicts.
