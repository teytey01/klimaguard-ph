# KlimaGuard PH — Full Codebase + Database Audit

Date: 2026-10-04. Scope: entire `src/`, `prisma/`, API routes, auth, client providers,
and the toolchain. Method: ran the full toolchain, exercised every API route and page
against the running dev server, reproduced upstream calls directly, and read every
correctness-sensitive module against the steering rules and the feature access matrix.

## Headline

The codebase is in strong shape. The toolchain is fully green and the app follows its
own conventions closely (no `any`, no `console.log`, Filipino-first strings, try/catch +
Filipino fallbacks on every route, correct role/location scoping, no-flash theme/lang).
The audit found **one high-impact runtime resilience defect**, two low-severity cleanups,
and one cosmetic test-runner warning. No security, auth, or data-scoping bugs were found.

## Baseline toolchain (all pass)

| Check | Result |
| --- | --- |
| `npx eslint .` | clean, 0 errors/warnings |
| `npx tsc --noEmit` | clean, 0 errors |
| `npm run build` | success, 25 routes |
| `npm test` | pass (15 pre-existing + 3 new = 18) |
| `npx prisma validate` | schema valid |

`prisma migrate status` reports "not managed by Prisma Migrate" — expected: the project
uses `db push` (no migrations dir) for hackathon speed. Not a defect.

---

## FINDING 1 — Weather/agriculture hard-fail with no survival path on provider outage (HIGH, fixed)

**Severity:** High (weather is the baseline, keyless, always-on feature).

**Observed symptom:** `GET /api/weather`, `GET /api/agriculture`, and `GET /api/pagasa`
all returned HTTP 503 on the running dev server.

**Investigation:** Reproduced the exact Open-Meteo call directly — it returns
`HTTP 429 {"reason":"Daily API request limit exceeded."}`. The free tier (~10k/day) was
exhausted by testing. The route code handles the error "correctly" (throws → 503 with a
Filipino message), so this is not a crash.

**Root cause:** Two compounding issues in `src/lib/api/weather.ts` / the routes:
1. `fetchOpenMeteoWeather` used `fetch(url, { next: { revalidate: 900 } })`, so Next's
   data cache would store the *failed* 429 response and re-serve it on retry.
2. There was **no last-known-good fallback** for weather (unlike `useAlerts`, which keeps
   the last alert in `localStorage` and serves it when the network is down). So the moment
   the keyless provider is rate-limited, the entire weather **and** agriculture experience
   dies until the quota resets the next day — the worst case for a mobile-first app on
   intermittent connectivity.

**Fix (root cause):** `src/lib/api/weather.ts` now keeps a server-side last-known-good
reading per `lat,lon` (24 h TTL), populated on every successful fetch. On a failed fetch
it returns that reading marked `stale: true` with a Filipino notice
("…Ipinapakita ang huling nakuhang datos (maaaring luma na).") instead of throwing. It
only throws when there has never been a successful reading to fall back to — preserving the
route's existing 503 contract for the genuine cold-start case. Added `stale?`/`notice?` to
`IWeatherData` in `src/types/index.ts`.

**Verification:** 3 new deterministic unit tests in `tests/api/weatherResilience.test.mjs`
mock `fetch` to prove: (a) success returns fresh data + primes the cache, (b) a subsequent
429 returns the stale reading flagged `stale` with a notice (not an error), (c) a 429 with
no prior reading still throws. All pass. See `full-audit-verification.md`.

**Note on live behavior:** On the live server during the active outage, `/api/weather` for
**Calamba** already returns 200 because the route tries the hardcoded PAGASA TenDay issuance
first (valid until Oct 10). `/api/agriculture` and uncovered locations return a clean
Filipino 503 on a *cold* start (empty cache) — correct, since there is nothing to recall
yet. The fallback engages once any single successful reading has been cached, which is the
real-world outage pattern.

---

## FINDING 2 — Dead scaffold placeholder route files (LOW, fixed)

**Observed:** `src/app/chat/index.ts`, `src/app/alerts/index.ts`, and
`src/app/api/transparency/index.ts` were pure scaffold placeholders (`export {}`). The
structure steering says these `index.ts` placeholders should be replaced by real route
files. `GET /chat` returns 404, but nothing links to `/chat` — the chat is embedded via
`<ChatWidget>` on the home page and dashboards — so it was never a broken link, just dead code.

**Root cause:** Leftover scaffolding from the initial project generation that real
`page.tsx` / `route.ts` files superseded.

**Fix:** Deleted the three dead `index.ts` files. The real routes (`alerts/page.tsx`,
`api/transparency/route.ts`) and the embedded chat are untouched. README references updated.

**Verification:** build still produces all 25 routes; lint/tsc clean. (`/chat` remains 404
by design — nothing routes there.)

---

## FINDING 3 — Test runner emits a reparse warning (LOW/cosmetic, fixed)

**Observed:** `npm test` printed `MODULE_TYPELESS_PACKAGE_JSON` warnings because
`node --test` imports `.ts` sources that it reparses as ESM.

**Root cause:** Node logs the warning whenever it type-strips a `.ts` file reached from a
`package.json` without `"type": "module"`.

**Fix:** Added `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` to the `test` script. Also
added a `@/` → `src/` ESM resolver hook (`tests/alias-loader*.mjs`, wired via `--import`) so
tests can import alias-using modules like `weather.ts` — previously impossible, which is why
the new resilience test needed it.

---

## Verified-correct (no change needed)

- **Auth/sessions:** opaque random token, only SHA-256 stored; HMAC-hashed mobile; scrypt
  passwords with constant-time compare; httpOnly/sameSite/secure cookie; expired sessions
  purged. (`lib/auth/*`)
- **Role + location scoping:** `reportScope` / `canRespond` block cross-municipality access
  at the query `where`; out-of-scope reports 404 (no existence leak); report POST takes
  location from the session, never the body; lgu excluded from barangay submission.
  Protected routes return 401/403/404 correctly (probed live).
- **API rules:** every route has try/catch + Filipino fallback; Open-Meteo always sends
  `timezone=Asia/Manila`; geocoding filters `country_code === "PH"` in code; `revalidate=900`
  (≥15 min); `PAGASA_API_KEY` is server-only and the app degrades to Open-Meteo when it is
  blank; `GROQ_API_KEY` never leaves the server.
- **Client providers:** theme + language no-flash head scripts use the same storage keys as
  the providers (`klimaguard-theme` / `klimaguard-lang`), default to light / Filipino,
  `suppressHydrationWarning` set; `useTheme` is only consumed by `ThemeToggle` (inside the
  provider), so the `AlertBanner`-above-`ThemeProvider` nesting is safe.
- **Prisma:** client singleton cached on `globalThis` in dev; seed is idempotent and matches
  the `hashPassword` format; DB seeded (8 users, 2 budgets, 2 reports).
- **Conventions:** no `: any`, no `console.log/debug/info` (only `console.error` in server
  catch blocks, which is allowed), `I`-prefixed interfaces, Filipino-first strings.
- **Secrets:** `.env*` is gitignored, so the Groq key present in `.env.local` is not tracked
  by git (`git ls-files` confirms). It is a live key in the working tree — rotate it before
  sharing the folder, but it is not committed.
