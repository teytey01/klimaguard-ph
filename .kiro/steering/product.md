# Product

KlimaGuard PH is a conversational AI climate assistant for Filipino communities — residents, farmers, and barangay officials. Built for the Build Over Nights hackathon.

## Users

- Residents checking weather before leaving home.
- Smallholder farmers planning planting around the monsoons.
- Barangay officials managing disaster preparedness (DRRM).

They speak Filipino first, English second. They are on mobile phones with intermittent connectivity, often reading outdoors.

## Problem

74% of Filipinos are vulnerable to climate hazards. Weather data is scattered across 4+ fragmented tools, 10 million farmers have no personalized advisories, and no single platform unifies climate intelligence.

## Product Purpose

Unify real-time weather, hazard alerts, agricultural advisories, and DRRM planning into one conversational AI interface.

**Success = one question in Filipino, one actionable answer within 3 seconds.**

## Brand Personality

Warm, trustworthy, Filipino-first — the voice of a knowledgeable neighbor, NOT a government portal. Calm in normal conditions; urgent but reassuring in emergencies.

## Tone

Casual Filipino (Taglish-friendly). Short sentences. Emojis sparingly (☀️🌧️🌾). Never condescending. During emergencies: direct, action-first, no fluff.

## Design Principles

1. One Question → One Answer → One Action.
2. Universal entry — everyone starts as a Resident (no role selection, no onboarding flows).
3. Filipino-first, English-fallback.
4. Safety overrides everything.
5. Mobile-first responsive design.
6. Light/dark mode — support both, with a user-facing toggle. Default to **light mode** (users read outdoors on mobile); let users opt into dark mode and remember their choice.

## Theme (Light / Dark Mode)

- Ship both a light and a dark theme with an explicit user-facing toggle (e.g. in the header or settings).
- **Default to light mode** for outdoor readability; do not auto-force dark.
- Respect the OS preference (`prefers-color-scheme`) as the initial default when the user hasn't chosen, then persist the user's explicit choice (e.g. `localStorage`).
- Keep Alert Red (`#E53E3E`) and emergency styling clearly legible in both themes — safety visuals override theme aesthetics.
- Ensure WCAG AA contrast in both themes.

## Anti-patterns (NEVER generate these)

- MUST NOT resemble a government portal or dashboard.
- MUST NOT use English-only interfaces.
- MUST NOT present raw data tables as the primary response.
- MUST NOT require role selection or onboarding flows.
- MUST NOT force a single theme or auto-apply dark mode without a toggle — the user chooses, and light is the default.

## Design Tokens

Brand palette (theme-independent):

| Token | Value | Use |
| --- | --- | --- |
| Navy | `#1A365D` | Primary brand, sidebar |
| Teal | `#38B2AC` | Accent, active states, agent bubbles |
| Alert Red | `#E53E3E` | Emergency alerts ONLY (both themes) |
| White | `#FFFFFF` | Text on dark, light-theme cards |
| Light Gray | `#F7FAFC` | Light-theme secondary backgrounds |

Theme surfaces:

| Role | Light | Dark |
| --- | --- | --- |
| App background | `#FFFFFF` | `#0F1B2D` (deep navy) |
| Secondary background | `#F7FAFC` | `#1A365D` (navy) |
| Card background | `#FFFFFF` | `#16263D` |
| Primary text | `#1A202C` | `#F7FAFC` |
| Secondary text | `#4A5568` | `#A0AEC0` |

- Teal and Alert Red stay constant across themes; verify contrast in both.
- Fonts: Montserrat (headings), Lexend (body), Poppins (UI accents: buttons, chips, labels, nav).
