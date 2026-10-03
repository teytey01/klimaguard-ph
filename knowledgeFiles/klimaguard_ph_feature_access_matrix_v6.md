## KlimaGuard PH Feature Access Matrix

## Definitive Version — 4 Roles | Version 6

Roles: Resident | Farmer | Barangay Official | Municipal Official Modules Covered: M1–M11 | Sections 1–17 KlimaGuard PH — Filipino-First Climate Intelligence Platform

About this document: This is the definitive Feature Access Matrix for KlimaGuard PH. It defines exactly which features, modules, and data each user role can access. Use this as the authoritative reference for system design, development, and user experience decisions.

## Changes from v5 to v6:

- Removed Farmgate price updates from Agricultural Advisory (M5) for all roles.

- Removed Farmgate price card from Home Dashboard Cards (Farmer).

- Removed Farmgate price update notification from Auto-Notifications (Farmer).

Legend: = Full access * = Partial/view access

Note: “Background” modules (M8, M9) operate automatically for all roles.

= Not accessible


## SECTION 1: Navigation & Menu Items

M5 visible for Farmer (personal), Barangay (area-wide), Municipal (municipal-wide). M6 visible for Barangay (barangay scope) and Municipal (municipal scope). M7 visible for Barangay (barangay) and Municipal (municipal-wide). M10 visible for Barangay (barangay) and Municipal (municipal-wide). M11 view-only for Resident/Farmer, edit own barangay for Barangay, full municipal access for Municipal.

| Navigation / Menu Item | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Home Dashboard |   |   |   |   |
| KlimaChat — Core Chat Agent (M1) |   |   |   |   |
| Weather & Forecast (M2) |   |   |   |   |
| Hazard & Disaster Alerts (M3) |   |   |   |   |
| Safety Advisor (M4) |   |   |   |   |
| Agricultural Advisory (M5) | Hidden | Personal | Area-wide | Municipal- |
|   |   |   |   | wide |
| LGU Planning Toolkit (M6) | Hidden | Hidden | Barangay | Municipal |
| DRRM Operations (M7) | Hidden | Hidden | Barangay | Municipal- |
|   |   |   |   | wide |
| Location Intelligence (M8) | Background | Background | Background | Background |
| Climate Knowledge Base (M9) | Background | Background | Background | Background |
| Analytics Dashboard (M10) | Hidden | Hidden | Barangay | Municipal- |
|   |   |   |   | wide |
| Transparency Tracker (M11) | View only | View only | Edit own | Full |
|   |   |   | brgy | municipal |
| ⚙ Profile & Settings |   |   |   |   |


## SECTION 2: Home Dashboard Cards

Municipal gets additional cards: all barangay compliance scores, municipal-wide affected population, cross-barangay comparison. v6 change: Farmgate price card removed from Farmer.

| Dashboard Card | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Current weather (temp, condition) |   |   |   |   |
| Rain probability (%) |   |   |   |   |
| Active alerts count |   |   |   |   |
| Current location (barangay) |   |   |   |   |
| Crop status card |   |   |   |   |
| Pest risk level card |   |   |   |   |
| DRRM fund status card |   |   |   |   |
| Compliance scorecard |   |   |   |   |
| Pending compliance deadlines |   |   |   |   |
| Affected population estimate |   |   | Barangay | Municipal- |
|   |   |   |   | wide |
| All barangay compliance scores |   |   |   |   |
| Cross-barangay comparison card |   |   |   |   |

SECTION 3: Weather & Forecast (M2)

| Weather Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Current temperature & condition |   |   |   |   |
| Rain probability (%) |   |   |   |   |
| Heat index |   |   |   |   |
| UV index |   |   |   |   |
| 3-day simplified forecast |   |   |   |   |
| 7-day detailed forecast |   |   |   |   |
| 10-day extended forecast |   |   |   |   |
| Hourly breakdown |   |   |   |   |
| Rainfall volume (mm) |   |   |   |   |
| Soil moisture level |   |   |   |   |
| Wind speed & direction |   |   |   |   |
| El Niño/La Niña status |   |   |   |   |


## SECTION 4: Hazard & Disaster Alerts (M3)

Municipal gets municipal-wide affected population, all barangay alerts, and consolidated reporting across the entire municipality.

| Alert Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Typhoon signal level |   |   |   |   |
| “Is it safe?” plain-language advisory |   |   |   |   |
| Flood / landslide / storm surge warnings |   |   |   |   |
| Nearest evacuation center + distance |   |   |   |   |
| Emergency hotlines (one-tap) |   |   |   |   |
| Typhoon track path & wind speed |   |   |   |   |
| Affected barangay list |   |   | Own | All |
|   |   |   | barangay | barangays |
| Municipal-wide affected population |   |   |   |   |
| Estimated affected population |   |   | Barangay | Municipal |
|   |   |   |   | total |
| Crop damage risk level |   |   |   |   |
| Livestock protection advisory |   |   |   |   |
| DRRM pre-disaster checklist trigger |   |   |   |   |
| All barangay alerts (consolidated) |   |   |   |   |
| Consolidated disaster reporting |   |   |   |   |
| Evacuation center capacity status |   |   | Own | All centers |
|   |   |   | centers |   |

## SECTION 5: Safety Advisor (M4)

| Safety Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| What to do per signal level (1–5) |   |   |   |   |
| Go-bag checklist |   |   |   |   |
| Evacuation route guidance |   |   |   |   |
| Post-disaster health tips (leptospirosis, |   |   |   |   |
| dengue) |   |   |   |   |
| “Eye of typhoon” warning |   |   |   |   |
| Crop protection safety steps |   |   |   |   |
| Livestock evacuation guide |   |   |   |   |
| Farm equipment securing checklist |   |   |   |   |
| Resident alert broadcast template |   |   |   |   |
| Community evacuation management guide |   |   |   |   |
| Post-disaster DANA assessment guide |   |   |   |   |


## SECTION 6: Agricultural Advisory (M5)

Resident not visible. Farmer personal farming use. Barangay area-wide advisory/coordination. Municipal municipal-wide crop data and agricultural program management. Includes crop damage estimates row for disaster reporting. v6 change: Farmgate price updates row removed entirely.

| Agricultural Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Crop calendar (planting/harvest windows) |   | Personal | Area-wide | Municipal- |
|   |   |   |   | wide |
| Planting recommendation (plant now or |   |   |   |   |
| wait?) |   |   |   |   |
| Pest & disease early warning |   | Own farm | Barangay- | All |
|   |   |   | wide | barangays |
| Spray / fertilize timing advisory |   |   |   |   |
| Crop-climate stress alerts (heat, flood, |   | Personal | Area-wide | Municipal- |
| drought) |   |   |   | wide |
| Crop damage estimates (for DANA report) |   | Personal loss | Barangay | Municipal |
|   |   |   | total | total |
| El Niño/La Niña crop strategy |   | Personal | For | For |
|   |   |   | advising | distribution |
|   |   |   | farmers |   |
| Climate-resilient variety recommendations |   |   |   |   |
| Harvest timing advisory |   |   | View only | View only |
| PCIC crop insurance info & reminders |   |   |   | Enrollment |
|   |   |   |   | stats |
| DA / RCEF government program alerts |   |   |   | Coordinate |
|   |   |   |   | distribution |
| Livestock protection advisory |   | Personal | Alert | Municipal- |
|   |   |   | livestock | wide |
|   |   |   | owners |   |


## SECTION 7: LGU Planning Toolkit (M6) — Barangay vs. Municipal Comparison

Resident and Farmer: not visible. Barangay Official: barangay-scope planning tools. Municipal Official: full municipal-scope tools plus CLUP Integration and CCET that are exclusive to municipal level.

| M6 Planning Feature | Barangay Official | Municipal Official |
| --- | --- | --- |
| CDRA Guided Workflow (6-step CCC-HLURB | Barangay-level CDRA | Municipal-level CDRA |
| methodology) |   | (consolidates all barangays) |
| LCCAP Guided Workflow (5-section plan, RA 9729) | Barangay input | Full municipal LCCAP |
| Barangay/Municipal Hazard Profile | Their barangay | All barangays + cross- |
|   |   | comparison |
| Climate Projections for planning | Their area | Municipal-wide projections |
| Compliance Scorecard (DILG SGLG) | Own barangay | Municipal + all barangay |
|   |   | scores |
| Compliance Deadline Reminders | Barangay deadlines | Municipal + all barangay |
|   |   | deadlines |
| CLUP Integration (Comprehensive Land Use Plan) |   | Municipal only |
| CCET — Climate Change Expenditure Tagging |   | Municipal budget tagging |

Note for Resident and Farmer: M6 is not visible in navigation. Both roles for all M6 features.

## SECTION 8: DRRM Operations (M7) — Barangay vs. Municipal Comparison

Resident and Farmer: not visible. Municipal gets consolidated DANA, all evacuation centers, and municipal LDRRMF tracking.

| M7 Operations Feature | Barangay Official | Municipal Official |
| --- | --- | --- |
| Pre-Disaster Checklist (auto-generated on signal | Barangay checklist | Municipal-wide + |
| raise) |   | coordinate all barangays |
| Evacuation Center Management | Own centers | All centers across |
|   |   | municipality |
| DANA Form — Damage Assessment and Needs | Barangay DANA (3-hr | Consolidated municipal |
| Analysis | deadline) | DANA (all barangays) |
| Resource / Relief Goods Inventory | Barangay supplies | Municipal warehouse + all |
|   |   | barangay inventories |
| Affected Population Tracker | Their barangay | Municipal-wide total |
|   |   | across all barangays |
| Relief Distribution Tracker | Their barangay | Municipal-wide + per- |
|   |   | barangay breakdown |
| MDRRMC / PDRRMC Situation Reports | Reports to MDRRMC | Reports to PDRRMC + |
|   |   | receives from all BDRRMCs |
| QRF — Quick Response Fund Tracker | Barangay QRF | Municipal LDRRMF (full |
|   |   | 70/30 split) |
| BDRRMC coordination (downward) |   | Coordinate all BDRRMCs in |
|   |   | municipality |

Note for Resident and Farmer: M7 is not visible in navigation. Both roles for all M7 features.


## SECTION 9: Analytics Dashboard (M10) — Barangay vs. Municipal

Resident and Farmer: not visible. Municipal gets cross-barangay comparison, crop damage analytics, and compliance dashboard across all barangays.

| M10 Analytics Feature | Barangay Official | Municipal Official |
| --- | --- | --- |
| Weather trends | Their area | Municipal-wide |
| Hazard maps (flood, landslide, storm surge) | Their barangay | All barangays overlaid |
| Risk assessment visualizations | Their barangay | Cross-barangay risk |
|   |   | comparison |
| Historical disaster data | Their barangay | Municipal-wide history |
| Climate projection charts | Their area | Municipal-wide projections |
| DRRM fund utilization charts | Barangay | Municipal + all barangay |
|   |   | budgets |
| Crop damage analytics |   | Municipal-wide crop loss |
|   |   | trends |
| Compliance dashboard (all barangays ranked) |   | All barangay compliance |
|   |   | scores ranked |

Note for Resident and Farmer: M10 is not visible. Both roles for all M10 features.

## SECTION 10: Transparency Tracker (M11) — 4 Roles with Permissions

Municipal can edit any barangay and upload municipal budget. No user can view data from other municipalities. Citizens can only report within their own barangay.

| M11 Transparency Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| View municipal DRRM budget allocation | View | View | View | Full |
| View own barangay’s infrastructure projects | View | View | Full | Full |
| View ALL barangay projects (same | View | View | View | Full |
| municipality) |   |   |   |   |
| Submit community report (own barangay) |   |   |   |   |
| Submit community report (any barangay) |   |   |   |   |
| View community reports |   |   |   |   |
| Respond to / resolve community reports |   |   | Own | Any |
|   |   |   | barangay | barangay |
| Update project status / completion % |   |   | Own | Any |
|   |   |   | barangay | barangay |
| Upload budget data |   |   |   | Municipal- |
|   |   |   |   | level |
| View data from other municipalities |   |   |   |   |


## SECTION 11: Auto-Notifications — 4 Roles

Municipal gets 10 notification types including municipal-wide coordination alerts. All roles receive the core safety and weather notifications. v6 change: Farmgate price update notification removed from Farmer.

| Auto-Notification | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Typhoon / flood / landslide alert |   |   |   |   |
| Weekly weather digest (Monday 6 AM) |   |   |   |   |
| Post-disaster health advisory |   |   |   |   |
| Extreme heat advisory (heat index >42°C) |   |   |   |   |
| Crop risk notification (heavy rain or |   |   |   |   |
| drought) |   |   |   |   |
| Pest outbreak warning |   |   |   |   |
| Harvest timing alert |   |   |   |   |
| El Niño / La Niña crop advisory |   |   |   |   |
| Government agri program alert (DA, RCEF) |   |   |   |   |
| DRRM pre-disaster checklist (on signal |   |   |   |   |
| raise) |   |   |   |   |
| DANA form (auto-sent after disaster) |   |   |   |   |
| Compliance deadline reminder (30/15/7 |   |   |   |   |
| days) |   |   |   |   |
| DRRM budget utilization alert (quarterly) |   |   |   |   |
| Community report received notification |   |   | Own | All |
|   |   |   | barangay | barangays |
| Transparency data updated notification | If following | If following |   |   |
| Municipal-wide coordination alert |   |   |   |   |


## SECTION 12: Emergency Mode — 4 Roles

Municipal gets 14 features including municipal-wide coordination. All roles see the core red alert banner and evacuation information.

| Emergency Feature | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Red alert banner (full-screen UI shift) |   |   |   |   |
| Signal level + wind speed |   |   |   |   |
| Nearest evacuation center + distance |   |   |   |   |
| Emergency hotlines (one-tap: 911, 143, |   |   |   |   |
| NDRRMC) |   |   |   |   |
| Safety steps per signal level |   |   |   |   |
| “View Evacuation Map” button |   |   |   |   |
| Crop protection emergency steps |   |   |   |   |
| Livestock evacuation guide |   |   |   |   |
| DRRM checklist activation |   |   |   |   |
| Evacuation center capacity tracker (live) |   |   | Own | All centers |
|   |   |   | centers |   |
| Affected population estimate |   |   | Barangay | Municipal |
| MDRRMC / PDRRMC reporting reminder |   |   |   |   |
| DANA form auto-sent (post-disaster) |   |   |   |   |
| Municipal-wide emergency coordination |   |   |   |   |
| All barangay evacuation status overview |   |   |   |   |


## SECTION 13: Feature Count Summary

v6 updates: Farmer totals reduced by 3 features (farmgate price card removed from Dashboard Cards; farmgate price updates removed from M5; farmgate price update notification removed from Auto-Notifications).

| Feature Category | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| Navigation items visible | 7 | 8 | 11 | 11 |
| Dashboard cards | 4 | 6 | 7 | 9 |
| Weather features (M2) | 6 | 10 | 9 | 10 |
| Alert features (M3) | 6 | 8 | 12 | 15 |
| Safety features (M4) | 5 | 8 | 8 | 8 |
| Agricultural features (M5) | 0 | 12 | 12 | 13 |
| LGU Planning features (M6) | 0 | 0 | 6 | 8 |
| DRRM Operations features (M7) | 0 | 0 | 8 | 9 |
| Analytics features (M10) | 0 | 0 | 6 | 8 |
| Transparency features (M11) | 4 | 4 | 5 | 7 |
| Auto-notifications | 4 | 8 | 9 | 10 |
| Emergency mode features | 6 | 8 | 13 | 15 |
| TOTAL FEATURES ACCESSIBLE | ~41 | ~71 | ~104 | ~120 |


## SECTION 14: M11 Location-Based Data Rules

Transparency Tracker data is entirely location-specific. Every municipality has its own budget, projects, and spending records. The system uses one database filtered by location — not separate databases per location.

*Table A — What Data Changes Per Location*

| Data Type | Location Level | Why It Differs | Example |
| --- | --- | --- | --- |
| DRRM Fund Allocation Municipal |   | Each municipality receives different IRA | Tacloban: ₱12.5M vs |
|   |   | → different 5% DRRM allocation | Ormoc: ₱8.7M |
| DRRM Fund Spending Municipal |   | Each municipality spends differently | Tacloban: 66% utilized vs |
|   |   |   | Ormoc: 45% |
| Infrastructure Projects | Barangay | Each barangay has its own flood | Brgy. San Jose: Seawall |
|   |   | control, drainage, seawall projects | 85% done |
| Project Budgets | Barangay/ | Each project has its own budget | Seawall: ₱5.2M vs |
|   | Municipal |   | Drainage: ₱3.1M |
| Community Reports | Barangay | Citizens report issues in their own | Seawall not finished in |
|   |   | barangay | Brgy. San Jose |
| Calamity/Relief Fund | Municipal | Triggered per disaster event per | Tacloban Typhoon Aghon: |
| Usage |   | municipality | ₱2.3M spent |

*Table B — M11 Permissions by Role and Location*

| Action | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- |
|   |   |   | Official | Official |
| View budget of own municipality |   |   |   |   |
| View projects in own barangay |   |   |   |   |
| View projects in other barangays (same |   |   |   |   |
| municipality) |   |   |   |   |
| View data of other municipalities |   |   |   |   |
| Submit community report (own barangay) |   |   |   |   |
| Submit community report (any barangay) |   |   |   |   |
| Respond to / resolve community reports |   |   | Own | Any |
|   |   |   | barangay | barangay |
| Update project status / completion % |   |   | Own | Any |
|   |   |   | barangay | barangay |
| Upload municipal budget data |   |   |   |   |


*Table C — M11 Data Sources*

| Data Source | What It Provides | How It Enters KlimaGuard PH |
| --- | --- | --- |
| DBM (Dept. of Budget & | National/regional budget allocations, | Pre-loaded from Full Disclosure Policy |
| Management) | IRA per municipality | public data |
| LGU Full Disclosure Policy | Municipal budget, DRRM fund allocation, | Pre-loaded; officials can update via M11 |
|   | project lists, AIP |   |
| COA (Commission on Audit) | Audit reports, fund utilization records | Pre-loaded from published audit reports |
| Barangay/Municipal Officials | Project status updates, completion %, | Officials upload/update directly through |
| (M11) | spending reports | M11 |
| Citizens (Community Reports) | “This project is incomplete,” ground- | Residents submit reports tied to their |
|   | truth verification | barangay |

*Table D — M11 Location Scope Summary*

| Role | What They Can See | What They Can Edit |
| --- | --- | --- |
| Resident / Farmer | Own municipality’s budget + all barangay | Community reports in own barangay only |
|   | projects within that municipality |   |
| Barangay Official | Same as resident + full project details for own | Own barangay’s project status + reports |
|   | barangay |   |
| Municipal Official | All barangays in own municipality — all | Any barangay in own municipality + municipal |
|   | budgets, projects, and reports | budget |
| Any Role | Cannot view another municipality’s data | Cannot edit another municipality’s data |


## SECTION 15: Sign-Up Data Collection — Updated for 4 Roles

Municipal Official does not select a barangay — they cover all barangays in their municipality. They select a Department (MDRRMO, Municipal Agriculture, Planning, Mayor’s Office) instead. Total fields: Resident 5+2, Farmer 6+5, Barangay 6+2, Municipal 6+2.

*Table A — Required Fields (All Roles)*

| Field | Input Type | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- | --- |
|   |   |   |   | Official | Official |
| Role | Dropdown | Required | Required | Required | Required |
| Region | Dropdown | Required | Required | Required | Required |
|   | (cascading) |   |   |   |   |
| Province | Dropdown | Required | Required | Required | Required |
|   | (filtered by |   |   |   |   |
|   | region) |   |   |   |   |
| Municipality / City | Dropdown | Required | Required | Required | Required |
|   | (filtered by |   |   |   |   |
|   | province) |   |   |   |   |
| Barangay | Dropdown | Required | Required | Required | Not |
|   | (filtered by |   |   |   | applicable |
|   | municipality) |   |   |   | (covers all) |
| Department (MDRRMO, Agri, | Dropdown |   |   |   | Required |
| Planning, etc.) |   |   |   |   |   |

*Table B — Additional Fields by Role*

| Field | Input Type | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- | --- |
|   |   |   |   | Official | Official |
| Secondary Role | Dropdown | Optional | Optional | Optional | Optional |
|   | (optional) |   |   |   |   |
| GPS Auto-Detect | Button (“Use | Optional | Optional | Optional | Optional |
|   | My Location”) |   |   |   |   |
| Email (for backup alerts) | Text input | Optional | Optional | Optional | Optional |
|   | (optional) |   |   |   |   |
| Primary Crop | Dropdown |   | Required |   |   |
|   | (Rice/Corn/ |   |   |   |   |
|   | Coconut/etc.) |   |   |   |   |
| Secondary Crop | Dropdown |   | Optional |   |   |
|   | (optional) |   |   |   |   |
| Farm Size | Dropdown |   | Optional |   |   |
|   | (<1ha / 1–3 / 3– |   |   |   |   |
|   | 5 / >5 ha) |   |   |   |   |
| Livestock | Checkbox |   | Optional |   |   |
|   | (Hog/Poultry/ |   |   |   |   |
|   | Cattle/etc.) |   |   |   |   |
| Position (Captain/Kagawad/ | Dropdown |   |   | Required |   |
| BDRRMC Chair) |   |   |   |   |   |
| BDRRMC Role (Chair/Member/ | Dropdown |   |   | Optional |   |
| None) |   |   |   |   |   |
| Required field total |   | 5 | 6 | 6 | 6 |


| Field | Input Type | Resident | Farmer | Barangay | Municipal |
| --- | --- | --- | --- | --- | --- |
|   |   |   |   | Official | Official |
| Optional field total |   | +2 | +5 | +2 | +2 |

## Table C — Sign-Up Flow (Screens)

| Screen What User Sees |   | Applies To | Est. Time |
| --- | --- | --- | --- |
| 1 | “Sino ka?” → Select role: Resident / Farmer / Barangay | All roles | ~5 sec |
|   | Official / Municipal Official + Optional secondary role |   |   |
| 2 | “Nasaan ka?” → Cascading dropdowns: Region → Province → | All roles | ~10 sec |
|   | Municipality → Barangay (except Municipal: no barangay) + |   |   |
|   | Optional GPS button |   |   |
| 3A | “Ano ang tinatanin mo?” → Primary crop dropdown + | Farmer only | ~10 sec |
|   | optional secondary crop, farm size, livestock |   |   |
| 3B | “Ano ang posisyon mo?” → Position dropdown + optional | Barangay Official only | ~5 sec |
|   | BDRRMC role |   |   |
| 3C | “Ano ang iyong department?” → Dropdown: MDRRMO / | Municipal Official only | ~5 sec |
|   | Municipal Agriculture / Municipal Planning / Mayor’s Office / |   |   |
|   | Other |   |   |
| 4 | “Email mo?” (optional) + “Allow Notifications?” (browser push | All roles | ~5 sec |
|   | permission) |   |   |
| Done | “Welcome sa KlimaGuard PH! ” → Role-specific home | All roles | — |
|   | screen loads |   |   |

*Table D — Privacy and Data Protection Rules*

| Rule | Implementation |
| --- | --- |
| No real name collected | Not required — role + location is sufficient for all features |
| No phone number collected | Not needed in Phase 1 (SMS fallback is Phase 2) |
| No government ID collected | Not needed — even officials do not need to prove identity |
| Email is optional | Used only for backup emergency alerts — never shared with third parties |
| GPS is optional | User can manually select location via cascading dropdowns instead |
| Location stored as barangay-level only | Exact GPS coordinates are not stored — only barangay/municipality reference |
| Data stored locally and server-side | Local storage for offline access; server for push notifications and analytics |
| No data sold or shared | All data used exclusively for KlimaGuard PH features |


## SECTION 16: Module 6 & 7 Detailed Breakdown

## Table A — M6: LGU Planning Toolkit Features

Main function: Helps officials create and manage mandatory climate governance documents required by Philippine law (RA 9729 and RA 10121). M6 = the blueprint. Long-term planning scope (months/years).

| M6 Feature | What It Does | Real Problem It Solves | Legal Basis |
| --- | --- | --- | --- |
| CDRA Guided Workflow Step-by-step through 6-step |   | LGUs hire expensive consultants | RA 10121, CCC- |
|   | Climate & Disaster Risk | or copy-paste from other LGUs | HLURB |
|   | Assessment (CCC-HLURB |   |   |
|   | methodology) |   |   |
| LCCAP Guided | Helps create the 5-section Local | Only ~90% of LGUs have LCCAPs; | RA 9729 (Climate |
| Workflow | Climate Change Action Plan (9- | many are outdated or copy-paste | Change Act) |
|   | step process) |   |   |
| Barangay / Municipal | Auto-generated hazard summary | Officials don’t know which | DILG SGLG |
| Hazard Profile | using HazardHunterPH + MGB + | hazards specifically threaten | requirement |
|   | PHIVOLCS data | their area |   |
| Climate Projections | Projected temperature, rainfall, | Plans are made without climate | CCC NICCDIES |
|   | sea-level change for planning | data — future risks are ignored |   |
| Compliance Scorecard | Tracks LGU compliance with DILG | Officials miss compliance | DILG SGLG |
|   | SGLG requirements | deadlines and lose SGLG | indicators |
|   |   | eligibility |   |
| Compliance Deadline | Auto-alerts at 30/15/7 days | Deadlines are forgotten until the | CCC, DILG circulars |
| Reminders | before LCCAP updates, SGLG | last minute |   |
|   | submission |   |   |
| CLUP Integration | Climate-informed | CLUP is created without climate | HLURB / DHSUD |
| (Municipal only) | Comprehensive Land Use Plan | hazard data |   |
|   | inputs |   |   |
| CCET — Climate | Tag municipal budget line items | Climate spending is not tracked | CCC NICCDIES |
| Change Expenditure | to climate adaptation/mitigation | or reported | portal |
| Tagging (Municipal |   |   |   |
| only) |   |   |   |


## Table B — M7: DRRM Operations Features

Main function: Provides operational tools for disaster response — before, during, and after a disaster. M7 = the action plan. Operational scope (hours/days). The BDRRMC initial report is due to MDRRMC within 3 hours of a disaster event.

| M7 Feature | When Used | What It Does | Legal / Protocol Basis |
| --- | --- | --- | --- |
| Pre-Disaster Checklist | Before disaster Auto-generated action list: alert residents, |   | RA 10121 Sec. 12 — |
|   |   | check evacuation centers, pre-position | BDRRMC contingency plans |
|   |   | relief goods, activate hotlines |   |
| Evacuation Center | During | Track capacity, occupancy, supplies at | NDRRMC camp coordination |
| Management | disaster | each center; municipality sees all centers | protocols |
| DANA Form (Damage | After disaster | Auto-generated template: affected | NDRRMOC SOPG 2024 — 3- |
| Assessment and Needs |   | population, casualties, housing damage, | hour initial report |
| Analysis) |   | infrastructure, agriculture |   |
| Resource / Relief | Before / during Track available relief goods, rescue |   | RA 10121 — LDRRMO must |
| Goods Inventory |   | equipment, medical supplies; municipality | maintain resource databases |
|   |   | sees all warehouses |   |
| Affected Population | During / after | Estimate families in hazard zones, track | NDRRMC 14 Essential |
| Tracker |   | evacuees, identify unaccounted persons | Elements of Information |
| Relief Distribution | After disaster Monitor food packs, NFIs distributed vs. |   | DSWD DROMIC system |
| Tracker |   | needed; per-barangay breakdown for | compliance |
|   |   | municipal |   |
| MDRRMC / PDRRMC | During / after | Auto-formatted situation reports for | NDRRMOC SOPG tiered |
| Reporting |   | upward chain: BDRRMC → MDRRMC → | reporting chain |
|   |   | PDRRMC → NDRRMC |   |
| QRF / LDRRMF Tracker | Before / after | Track 30% QRF activation and spending; | RA 10121 Sec. 21 — 70/30 |
|   |   | municipal tracks full 70/30 LDRRMF split | LDRRMF rule |
| BDRRMC Coordination | All phases | Municipal coordinates all BDRRMCs in the | RA 10121 — MDRRMC |
| (Municipal only) |   | municipality | oversees all BDRRMCs |

## Table C — M6 vs. M7 Comparison

| Dimension | M6 — LGU Planning Toolkit | M7 — DRRM Operations |
| --- | --- | --- |
| When is it used? | Before disasters (long-term planning) | Before, during, and after disasters |
|   |   | (operational) |
| Purpose | Create compliance documents and plans | Execute disaster response actions |
| Timeframe | Months / years (CDRA, LCCAP, compliance) | Hours / days (checklists, DANA, evacuation) |
| Think of it as | The blueprint | The action plan |
| Example query | “Help me create our LCCAP” | “Signal #2 — give me the pre-disaster |
|   |   | checklist NOW” |
| Legal basis | RA 9729 (Climate Change Act) | RA 10121 (DRRM Act) |
| Frequency of use | Quarterly / annually | During every disaster event |
| Who uses it | Barangay Official + Municipal Official | Barangay Official + Municipal Official |
| Relationship | M6 creates the plans — M7 executes them when disaster strikes |   |


SECTION 17: Privacy & Data Protection Rules

| SECTION 17: Privacy & Data Protection Rules |   |
| --- | --- |
| Rule | Policy and Implementation |
| Data Minimization | Only collect what is strictly needed for the user to access features: role, location, |
|   | and role-specific details. No names, IDs, or phone numbers. |
| No Registration Required | The system works without creating a named account. Users are identified by role + |
|   | location, not personal identity. |
| GPS is Opt-In | Users may manually type their location via cascading dropdowns instead of |
|   | granting GPS permission. Both methods provide full functionality. |
| Location Stored at Barangay | Exact GPS coordinates (latitude/longitude) are not stored. Only the barangay/ |
| Level Only | municipality reference is retained for data filtering. |
| Email is Optional and Siloed | Email is used exclusively for backup emergency alerts and weekly digest. It is |
|   | encrypted and never shared with third parties or other users. |
| Anonymous Community | Community reports in M11 do not require the reporter’s name or identity. Reports |
| Reporting | are tied to a barangay, not a person. |
| No Cross-Municipality Data | No user — regardless of role — can view or edit data from a municipality other |
| Access | than their own. This is enforced at the database query level. |
| Session-Based Chat Context | Chat history lives within the current session. Conversations are not permanently |
|   | stored unless the user explicitly opts into history sync. |
| Data Attribution on All Responses All weather, hazard, and agricultural data displayed includes its source (PAGASA, |   |
|   | Open-Meteo, NDRRMC) and last-updated timestamp. |
| AI Uncertainty Disclosure | When data confidence is low or a forecast is uncertain, the chat agent explicitly |
|   | discloses this rather than presenting uncertain data as definitive. |
| No Medical Advice | The system never provides medical recommendations. During post-disaster health |
|   | queries, users are always redirected to DOH hotlines or the nearest health center. |
| Infrastructure on AWS | All data is processed and stored on Amazon Web Services infrastructure. AWS |
|   | security standards, including encryption at rest and in transit, apply to all user data. |
| No Third-Party Data Sales | User data is used exclusively for KlimaGuard PH features. It is never sold, shared, |
|   | or licensed to third parties. |
| Offline Data is Static and Safe | PWA-cached data (evacuation centers, hotlines, safety protocols) is pre-verified |
|   | static information. No user-generated data is included in the offline cache. |
