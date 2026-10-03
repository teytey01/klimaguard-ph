# klimaguard-ph
Filipino-First Climate Intelligence Platform — Build Over Nights Hackathon

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # root layout, mounts <AlertBanner/>
│   ├── page.tsx            # home dashboard
│   ├── alerts/page.tsx     # hazard alerts + hotlines (M3/M4)
│   └── api/alerts/route.ts # alerts API (15-min revalidate)
├── components/
│   └── alerts/             # AlertBanner, EvacuationCard
├── hooks/                  # useAlerts (offline-first cache)
└── types/                  # I-prefixed shared interfaces
```

## Modules Implemented

- [x] M3 Hazard Alerts — full-width AlertBanner, G07 safety priority
- [x] M4 Safety Advisor — EvacuationCard, always-on emergency hotlines
- [ ] M2 Weather
- [ ] M8 Location
- [ ] M1 KlimaChat
- [ ] M11 Transparency

## Setup

```bash
npm install
npm run dev     # start dev server
npm run build   # production build
npm run lint    # ESLint
```

_Last updated: 2025-10-03_
