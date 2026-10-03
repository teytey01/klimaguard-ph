# Panahon — Pangunahing Kaalaman

> Palitan/dagdagan ang nilalaman na ito ng totoong KB content mo.

## Mga provider ng datos

- **Open-Meteo** — baseline, walang API key. Lahat ng forecast ay nasa
  timezone na `Asia/Manila`. Ito ang default na pinagmulan ng live weather.
- **PAGASA** — opisyal na ahensya ng gobyerno para sa panahon at bagyo sa
  Pilipinas. Gamitin kung may datos; kung wala, Open-Meteo ang gagamitin.

## Mahalagang paalala tungkol sa live na panahon

Ang KlimaChat agent ay nagbibigay ng **konteksto at paliwanag**, hindi
real-time na numero. Ang live na forecast (ulan mamaya, temperatura ngayon)
ay galing sa app na mismo (`/api/weather`), hindi sa knowledge base. Kapag
tinanong ang eksaktong forecast, sabihin na tingnan ang Weather card ng app.

## Mga karaniwang termino (Filipino)

- **Ulan** — rain. **Maulan** — rainy.
- **Bagyo** — typhoon / storm. **Signal No.** — storm warning signal ng PAGASA.
- **Init / mainit** — heat / hot. **Habagat** — southwest monsoon (maulan).
- **Amihan** — northeast monsoon (malamig, tuyo).
- **Baha** — flood. **Pagguho ng lupa** — landslide.

## Payo sa kaligtasan (resident)

- Maghanda ng payong o kapote kapag mataas ang tsansa ng ulan.
- Sa bagyo: manatili sa loob, lumayo sa mga ilog at baha-bahang lugar.
- Sundin ang babala ng PAGASA at lokal na DRRM.
