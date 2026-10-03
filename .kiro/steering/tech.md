# Tech Conventions

## Stack

- **Framework:** Next.js `16.3.8` with the **App Router** (NOT Pages Router). This is a newer major than "14+" in planning docs — treat Next.js 16 conventions as authoritative and read the relevant guide in `node_modules/next/dist/docs/` before writing framework code, as APIs may differ.
- **Language:** TypeScript 5, `strict` mode enabled.
- **UI:** React 19.
- **Styling:** Tailwind CSS v4 only (no CSS modules, no styled-components). Imported via `@import "tailwindcss"` in `src/app/globals.css`; theme defined inline with `@theme` (no `tailwind.config.js`).
- **State:** React `useState` / `useContext` (no Redux, no Zustand).
- **Data fetching:** native `fetch`; client-side for real-time weather.
- **Dates:** `date-fns` v4.
- **Linting:** ESLint 9 with `eslint-config-next` (`core-web-vitals` + `typescript`).
- **AI orchestration:** Amazon Quick (chat agent, knowledge base via Amazon Quick Spaces).
- **Deployment:** Vercel (auto-deploy from `main`).

## Code Style Rules

- All components: functional, with TypeScript props interfaces defined and exported in the same file.
- No `any` — always define proper interfaces (`I`-prefixed, e.g. `IWeatherData`).
- No inline styles — Tailwind utility classes only.
- No `console.log` in production — use error boundaries.
- All API calls: MUST have try/catch with graceful fallback.
- All user-facing text: MUST default to Filipino.
- All weather data: MUST include source attribution.
- All emergency responses: MUST override normal flow.

## Environment Variables

Defined in `.env.local`. Client-exposed values use the `NEXT_PUBLIC_` prefix; secrets (e.g. `PAGASA_API_KEY`) are server-only and MUST NOT be exposed to the client.

- `NEXT_PUBLIC_OPEN_METEO_BASE`, `NEXT_PUBLIC_GEOCODING_BASE` — API base URLs.
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_DEFAULT_LAT`/`LON`/`LOCATION`/`REGION` — app + default location (Calamba, Laguna / CALABARZON).
- `PAGASA_API_KEY` — optional; blank means Open-Meteo-only.

## API Integration Rules

- **Open-Meteo:** no API key, ~10,000/day limit. ALWAYS pass `timezone=Asia/Manila`. This is the baseline provider and the no-key path.
- **PAGASA TenDay:** API key required (100 burst / 1,000 daily). ALWAYS keep Open-Meteo as fallback; the app MUST degrade gracefully when `PAGASA_API_KEY` is absent.
- **Geocoding:** filter to `country_code === "PH"` ONLY.
- **Caching:** cache API responses for 15 minutes minimum.
- **Errors:** fall back gracefully with a Filipino message.
- **Hazard data:** NDRRMC feeds.

## Component Patterns

- One component per file — no multi-component files.
- Props interfaces defined and exported in the same file.
- Loading states: skeleton loaders (not spinners).
- Error states: Filipino message + retry button.
- Empty states: helpful Filipino suggestion.

## Design Token Usage (Tailwind classes)

Arbitrary values are fine with Tailwind v4; prefer promoting them to `@theme` CSS variables in `globals.css` so themes can swap values.

| Purpose | Class |
| --- | --- |
| Navy BG | `bg-[#1A365D]` |
| Teal accent | `text-[#38B2AC]` / `border-[#38B2AC]` |
| Alert Red | `bg-[#E53E3E]` (EMERGENCY ONLY) |
| Card BG | `bg-white` |
| Secondary BG | `bg-[#F7FAFC]` |
| Text on dark | `text-white` |
| Text on light | `text-gray-800` |

- Fonts (via `next/font/google` in `layout.tsx`): Montserrat for headings (`font-heading`, default on h1–h6), Lexend for body (`font-sans`, default), Poppins for UI accents (`font-ui`, default on buttons/inputs/nav/labels).

## Light / Dark Mode

- Support both themes with a user-facing toggle; **default to light**. See product.md for the surface tokens and UX rules.
- Use Tailwind's class strategy: toggle a `dark` class on `<html>` and write dark variants with the `dark:` prefix (e.g. `bg-white dark:bg-[#16263D]`). In Tailwind v4, enable this with `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css`.
- Prefer theme-aware CSS variables defined under `:root` and `.dark` in `globals.css` (via `@theme`) over scattering raw hex per component, so a single toggle flips the whole app.
- Initialize from `prefers-color-scheme` on first visit, then persist the user's explicit choice (e.g. `localStorage`); apply the stored theme before paint to avoid a flash.
- The current scaffold uses a `@media (prefers-color-scheme: dark)` block in `globals.css` with no toggle — replace it with the class-based approach above when wiring up the toggle.

## Common Commands

```bash
npm run dev     # start the dev server (do not run as a blocking background task in tooling)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

No test runner is configured yet. Add one (and a `test` script) before writing tests.

## Git Conventions

- Commit after every completed cycle (Cycle 0–9). Format: `cycle-N: brief description`.
- Work on `main` branch (hackathon speed).
- Tag the demo: `git tag demo-ready`.

## Performance Targets

- First Contentful Paint: < 2s on 3G mobile.
- Chat response display: < 500ms after API returns.
- Weather data refresh: every 15 minutes.
- Mobile viewport: 375px minimum width.
