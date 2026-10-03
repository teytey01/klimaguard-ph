# klimaguard-ph

Filipino-First Climate Intelligence Platform — Build Over Nights Hackathon.

A conversational AI climate assistant for Filipino communities (residents, farmers,
barangay officials) unifying weather, hazard alerts, and agricultural advisories.

## Setup

```bash
npm install
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

Environment variables live in `.env.local` (see `.kiro/steering/tech.md`).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # root layout + metadata
│   ├── page.tsx            # home dashboard (WeatherPanel + ChatWidget)
│   ├── agriculture/page.tsx # agricultural advisory surface
│   ├── globals.css         # Tailwind v4 theme + typing-dot keyframes
│   └── api/
│       ├── agriculture/route.ts # crop advisory (Region VIII, Open-Meteo)
│       ├── chat/route.ts       # chat Route Handler (Amazon Quick stand-in)
│       ├── geocoding/route.ts  # Open-Meteo geocoding proxy (PH-only)
│       ├── weather/route.ts    # Open-Meteo forecast proxy (PAGASA fallback)
│       ├── pagasa/route.ts     # PAGASA TenDay proxy (server-only, additive)
│       └── transparency/route.ts # DRRM fund transparency (COA/DBM/DILG demo)
├── components/
│   ├── agriculture/        # CropAdvisoryCard, AgriculturePanel
│   ├── chat/               # ChatWidget, MessageBubble, SuggestionChip, TypingIndicator, EmbedCard (+ barrel)
│   ├── common/             # ThemeProvider, ThemeToggle, LocationSearch
│   ├── transparency/       # BudgetTracker (DRRM allocation/spending)
│   └── weather/            # WeatherCard, ForecastStrip, WeatherPanel
├── hooks/                  # useLocation, useWeather
├── lib/
│   ├── agent/              # quickClient (server-only Amazon Quick client)
│   ├── agriculture/        # cropData (Region VIII), advisory (pure derivation)
│   ├── api/                # geocoding, weather, pagasa clients
│   ├── constants/          # shared chat strings (fallback, greeting)
│   ├── transparency/       # transparencyData (DRRM demo figures)
│   └── utils/              # weatherCodes (WMO→Filipino), dateFilipino
└── types/index.ts          # shared types (ILocation, IWeatherData, ...)
```

## Modules Implemented

- [x] M1 — KlimaChat (core chat interface)
- [x] M2 — Weather
- [ ] M3 — Hazard Alerts
- [ ] M4 — Safety Advisor
- [x] M5 — Agriculture
- [x] M8 — Location
- [ ] M9 — Knowledge Base
- [x] M11 — Transparency

---

_Last updated: 2026-10-06_
