

KlimaGuard PH
Filipino-First Climate Intelligence Platform
## Document: Project Documentation — Updated Version
## Hackathon: Kiro × Quick Build Over Nights Hackathon
## Track: Climate Change — Smarter Ecosystems
Organizer: AWSUG.PH
## Date:    October 3–4, 2026
Modules: 11 interconnected modules (M1–M11)
## Roles: Resident • Farmer • Barangay Official • Municipal Official

## 01 — Project Overview
What is KlimaGuard PH?
KlimaGuard PH is the Philippines' first unified, AI-powered climate intelligence web application — built
for the Kiro × Quick Build Over Nights Hackathon under the Climate Change — Smarter Ecosystems
track. It transforms how Filipinos access, understand, and act on climate information by aggregating
data from PAGASA, HazardHunterPH, Project NOAH, and NDRRMC into one conversational interface
— delivering clear, actionable, Filipino-language responses to anyone with a browser.
## The Problem
The Philippines has 25+ climate dataset categories, 17+ operational tools, and 9 free climate APIs —
but no single platform integrates them. Users must navigate 4 or more separate systems. Projected
GDP losses reach up to 13.6% by 2040 as climate impacts intensify.
Pain PointImpact
No unified climate data platformUsers navigate 4+ separate systems for complete information
74% of population vulnerable to climate
disasters
Projected GDP loss up to 13.6% by 2040
67% of LGUs cite funding shortages59% lack digital infrastructure; 57% face skills shortages
~10M family farmers with no crop advisoriesNo location-based, crop-specific climate guidance exists
All existing tools are English-onlyNo offline capability; limited mobile access across 42,000
barangays
## The Solution
KlimaGuard PH provides a unified chat-based web platform powered by an AI agent that delivers
Filipino-language, location-based, and actionable climate intelligence — accessible to every Filipino
resident, with specialized depth for farmers, LGU officials, and DRRM officers.
## Competitive Analysis
KlimaGuard PH outscores all existing platforms. Biggest gaps to exploit: offline capability, Filipino/
regional language support, and mobile-first accessibility — areas where every existing platform scores
below 5.5, and KlimaGuard PH scores 8.0 or higher.
CapabilityProject NOAHHazardHunterPHPAGASAHandaKlimaGuard PH
## Hazard Coverage6.09.05.57.08.0
## Mobile Access4.05.57.05.09.0
LGU Usability6.05.05.05.08.5

CapabilityProject NOAHHazardHunterPHPAGASAHandaKlimaGuard PH
## Data Integration5.08.06.07.08.5
## Language Support3.53.54.05.08.5
## Offline Capability1.51.51.51.58.0

## 02 — Target Users
KlimaGuard PH serves four user roles. The Farmer is not a separate account — it is a profile add-on
enabled within the Resident account.
RoleWho They AreScopeExamples
ResidentEveryday Filipino citizen — the
default starting point
Their barangayStudents, workers, commuters,
parents, seniors
FarmerResident who enables the Farmer
Profile in Settings; NOT a separate
account
Their farm area +
barangay
Rice farmer, corn farmer,
coconut farmer, livestock raiser
## Barangay
## Official
Elected or appointed barangay
leader — pre-created account only
Their barangayBarangay Captain, Kagawad,
BDRRMC Chair, Barangay
## Secretary
## Municipal
## Official
Municipal or City government staff
— pre-created account
Entire municipality
(all barangays)
Mayor, MDRRMO, Municipal
## Agriculturist, Municipal
## Planning Officer
Key Principle: Residents and Farmers are read-only consumers of guidance — they ask and receive.
Barangay Officials and Municipal Officials are producers and managers of data — they input, edit,
report, and coordinate.

## 03 — Account Model & Authentication
## Three Account Types
Account TypeHow It Is CreatedLogin Method
## Resident Account (includes
optional Farmer Profile)
Self sign-up by the userMobile number +
## OTP (SMS)
Barangay Official AccountPre-created by system or municipal admin
— no self-registration
## Username +
## Password
Municipal Official AccountPre-created by system admin — no self-
registration
## Username +
## Password
Resident Sign-Up Flow (Self-Service, ~20 seconds)
StepAction
1Enter mobile number
2Receive 6-digit OTP via SMS → enter code to verify
3Select location: Region → Province → Municipality → Barangay
4Done → Resident home screen loads
Enabling Farmer Profile (Within Resident Account)
StepAction
1Go to Profile & Settings
2Toggle "I'm also a farmer" ON
3Select primary crop type from dropdown
4Done → Farmer features unlocked; can be toggled OFF anytime
Official Login Flow (Pre-Created Accounts)
StepAction
1Enter username (provided by admin)
2Enter password (provided by admin)
3Done → Role-specific home screen loads; location and role already assigned

## Data Collected Per Account Type
## Data Field
Resident (Sign-
## Up)
Farmer (Profile Add-
## On)
Barangay (Pre-
## Created)
Municipal (Pre-
## Created)
Mobile number✓ Required— (already has it)✗✗
OTP verification✓ Required— (already verified)✗✗
## Username✗✗✓ Pre-assigned✓ Pre-assigned
## Password✗✗✓ Pre-assigned✓ Pre-assigned
## Role✓ Auto-set:
## Resident
## ✓ Added: Farmer
profile
## ✓ Pre-assigned✓ Pre-assigned
## Location
## (cascading)
✓ Selected at
sign-up
— (already has it)✓ Pre-assigned✓ Pre-assigned
Full name✗✗✓ Pre-registered✓ Pre-registered
## Email✗✗✓ Pre-registered✓ Pre-registered
## Position / Title✗✗✓ Pre-registered✓ Pre-registered
## Department✗✗✗✓ Pre-registered
Primary crop
type
✗✓ Selected when
enabling profile
## ✗✗
GPS (auto-
detect)
Optional— (already has it)OptionalOptional

04 — System Modules (M1–M11)
KlimaGuard PH is built from 11 interconnected modules. Each module handles a specific function in
the climate intelligence pipeline. Note: Farmgate price updates are NOT included in M5.
ModuleNameFunctionWho Can Access
M1KlimaChat —
## Core Chat Agent
Primary conversational interface. Filipino-
first language, layered responses, context-
aware follow-ups, central routing hub for
all queries.
All roles
M2Weather &
## Forecast
Real-time weather and 3–10 day
forecasts. Hourly breakdown, soil
moisture, and El Niño/La Niña status for
farming roles.
All roles (depth varies by role)
M3Hazard &
## Disaster Alerts
Typhoon tracking, flood/landslide/storm
surge warnings, evacuation center lookup,
real-time disaster bulletins.
All roles (officials get
management tools)
M4Safety AdvisorTranslates raw hazard data into simple,
actionable safety guidance in plain
Filipino. Go-bag checklists, evacuation
routes, post-disaster health tips.
All roles
M5Agricultural
## Advisory
Crop-specific, location-based farming
guidance. Planting windows, pest/disease
alerts, crop-climate stress, harvest timing,
PCIC insurance reminders.
## Farmer (personal), Barangay
## (area-wide), Municipal
(municipal-wide). NOT visible
to Residents.
M6LGU Planning
## Toolkit
CDRA and LCCAP guided workflows,
barangay hazard profiles, climate
projections, DILG SGLG compliance
scorecard, deadline reminders.
## Barangay Official (barangay
level), Municipal Official
(municipal level). Resident and
Farmer: hidden.
## M7DRRM
## Operations
Pre-disaster checklists, evacuation center
management, DANA forms, relief
distribution tracking, MDRRMC/PDRRMC
reporting, QRF tracker.
## Barangay Official (barangay),
## Municipal Official (municipal-
wide). Resident and Farmer:
hidden.
M8Location
## Intelligence
GPS auto-detection, barangay-level
granularity, cascading location selection.
Makes all modules area-specific.
Operates in background.
All roles (background,
automatic)

ModuleNameFunctionWho Can Access
M9Climate
## Knowledge Base
All indexed climate documents, hazard
maps, crop calendars, CDRA/LCCAP
templates, PAGASA bulletins, and safety
guides the agent draws from.
All roles (background,
automatic)
M10Analytics
## Dashboard
Regional climate trends, historical
comparisons, hazard frequency maps,
DRRM fund utilization charts, cross-
barangay compliance ranking.
## Barangay Official (barangay
scope), Municipal Official
(municipal-wide). Resident and
Farmer: hidden.
M11Transparency
## Tracker
DRRM budget tracking, infrastructure
project status with completion %,
community reporting/flagging. Inspired by
Naga City's budget portal.
All roles (Resident/Farmer:
view only; Officials: full access)
Module Build Priority for the Hackathon
PriorityModuleWhy BuildPhase
Must HaveM1 — KlimaChatEverything runs through this — no agent, no
product
Phase 1 (Hours 0–
## 3)
Must HaveM9 — Knowledge
## Base
The agent is only as smart as its dataPhase 1 (Hours 0–
## 3)
Must HaveM2 — WeatherThe #1 reason anyone opens the app dailyPhase 1–2 (Hours
## 1–4)
Must HaveM8 — LocationWithout location, every answer is genericPhase 1–2 (Hours
## 1–4)
## Should
## Have
M3 — Hazard AlertsHigh-impact demo moment for judgesPhase 2 (Hours 3–
## 5)
## Should
## Have
M4 — Safety AdvisorMakes the app feel human and caringPhase 2 (Hours 4–
## 6)
## Should
## Have
M5 — AgriculturalUnique differentiator — no competitor has thisPhase 2 (Hours 5–
## 7)
## Should
## Have
## M11 —
## Transparency
The killer accountability differentiatorPhase 2–3 (Hours
## 6–8)
Nice to
## Have
M6 — LGU PlanningImpressive but complex — show as concept if
time is short
Phase 2–3 (Hours
## 6–8)
Nice to
## Have
M7 — DRRM OpsCan be demoed with pre-loaded templatesPhase 2–3 (Hours
## 6–8)
Nice to
## Have
M10 — AnalyticsVisual wow factor for the pitchPhase 3 (Hours 7–
## 9)

Golden Rule: If M1 + M2 + M8 + M9 are solid, you have a demoable product. Everything else adds
depth.

05 — Feature Access by Role
## Module Access Summary
ModuleResidentFarmerBarangay Official
## Municipal
## Official
M1 KlimaChat✓✓✓✓
M2 Weather & ForecastBasic (3-
day)
## Enhanced (10-day,
soil moisture)
## ✓✓
M3 Hazard & Alerts✓✓ + crop damage risk✓ + management
tools
✓ + municipal-
wide
M4 Safety Advisor✓✓ + farm/livestock✓ + community
mgmt
## ✓
M5 Agricultural✗✓ Personal use✓ Area-wide view✓ Municipal-wide
M6 LGU Planning✗✗✓ Barangay level✓ Municipal level
M7 DRRM Operations✗✗✓ Barangay✓ Municipal-wide
## M8 Location
## (background)
## ✓✓✓✓
## M9 Knowledge Base
## (background)
## ✓✓✓✓
## M10 Analytics
## Dashboard
## ✗✗✓ Barangay✓ Municipal-wide
## M11 Transparency
## Tracker
View onlyView only✓ Edit own
barangay
✓ Full municipal
access
Interaction Level by Role
RoleInteraction TypeData Entry
## Total
## Features
ResidentChat + view only. Data flows
FROM system TO user.
None (except simple community
report)
## ~41
FarmerChat + view only. Data flows
FROM system TO user.
None (except simple community
report)
## ~71
## Barangay
## Official
Chat + view + edit + forms. Data
flows both ways.
DANA forms, budget data, project
updates, DRRM reports
## ~104

RoleInteraction TypeData Entry
## Total
## Features
## Municipal
## Official
Chat + view + edit + manage.
Data flows both ways.
Full data management across all
barangays in municipality
## ~120
## Same Question, Different Answer
QueryResidentFarmer
Official (Barangay/
## Municipal)
"Uulan ba
mamaya?"
Maaraw hanggang
3PM, mag-uulan ng
gabi. Magdala ng
payong!
Uulan ng gabi, ~15mm. Safe
mag-fertilize ngayong umaga.
Hindi makakaapekto sa palay
mo.
Light to moderate rain 6PM–
12MN. 3 low-lying barangays
to monitor. No flood advisory
yet.
"May bagyo
ba?"
⚠ Signal #2 sa area
mo. Nearest
evacuation: Brgy. Hall,
## 500m.
## Signal #2 — Harvest
immediately. Secure livestock.
Expected crop damage:
moderate for rice.
Signal #2. 12 barangays
affected. Activate evacuation
plan for coastal zones. Report
to MDRRMC.

## 06 — Data Protection & Privacy
Two-Tier Privacy Model
DimensionResident & FarmerBarangay & Municipal Official
IdentitySemi-anonymous — phone number only, no
name collected
Fully identified — name + email + position
pre-registered by admin
WhyPrivacy-first for citizens. They only read data
— no accountability needed.
Public accountability. Officials manage public
data and must be traceable.
Audit trailNot needed (read-only users)Every edit logged: WHO changed it, WHEN,
and WHAT was changed
What We Do NOT Collect (from Residents/Farmers)
No real name • No government ID • No home address • No age or birthday • No gender • No income •
No social media • No browsing history
## How Each Data Type Is Protected
DataProtection MethodWho Can See It
Mobile numberHashed (one-way encryption); OTP expires in 5
min; 3 failed attempts = 15 min lockout
System only (for OTP
verification)
LocationStored as barangay name only — exact GPS
coordinates NOT stored; encrypted; location-
scoped access
System only (for data
filtering)
Official name & emailEncrypted; visible only in audit trail; OTP + role
verification required to login
System + audit logs only
(not shown to other users)
Farmer crop typeEncrypted; used only for advisories; no third-party
sharing
System only
Chat conversationsSession-only — NOT permanently stored; cleared
when session ends
No one (deleted after
session)
Community reportsAnonymous for residents/farmers (no identity
attached); encrypted
Officials in same barangay/
municipality
Official data (DANA,
budget, projects)
Full audit trail (WHO, WHEN, WHAT); role-based
access; version history only
Officials in reporting chain
only

AWS Infrastructure Security
LayerProtection
StorageAES-256 encryption at rest (AWS S3 + DynamoDB)
TransmissionHTTPS / TLS 1.3 — all data encrypted in transit
AuthenticationAWS Cognito + OTP via AWS SNS (residents); username + password for officials
Access controlAWS IAM + role-based policies — only authorized services can access specific data
DDoS protectionAWS Shield
MonitoringAWS CloudWatch + CloudTrail — all access attempts logged
Cross-municipalityBlocked at database query level — users can only see their own municipality's data
Legal compliance: RA 10173 (Philippine Data Privacy Act) — principles of data minimization,
legitimate purpose, and proportionality. No data is ever sold or shared with third parties.

## 07 — System Architecture
KlimaGuard PH follows a six-layer top-to-bottom flow. Every user interaction enters through the
KlimaChat routing hub (M1) — enriched by Location Intelligence (M8) — then routed to the
appropriate feature module based on detected intent. All modules draw from the Climate Knowledge
Base (M9) and Analytics Dashboard (M10), continuously fed by external APIs.
## Layer 1: Users & Authentication
Account TypeRoleAuthentication MethodCreation Method
Resident AccountResident
## (default)
Mobile number + OTP (SMS)Self sign-up
## Resident Account +
## Farmer Profile
## Resident +
Farmer add-on
Mobile number + OTP (SMS); Farmer
Profile toggled ON in Settings
Self sign-up; profile
add-on self-enabled
## Barangay Official
## Account
## Barangay
## Official
Username + Password (pre-assigned)Pre-created by system
or municipal admin
## Municipal Official
## Account
Municipal OfficialUsername + Password (pre-assigned)Pre-created by system
admin
Note: Farmer is NOT a separate account type — it is a profile add-on within the Resident account. There are only 3
account types and 4 roles.
## Layer 2: Frontend
ViewWho Sees ItPurpose
Chat InterfaceAll roles (primary view for
Residents and Farmers)
Core conversational entry point — user types
question, agent responds in Filipino
Dashboard ViewAll rolesAt-a-glance weather, active alerts, and quick action
buttons alongside embedded chat
## Emergency
## Alert View
All roles (auto-triggered by
active disaster)
Full-width red alert banner with nearest evacuation
center, affected area, and floating chat
Admin PanelBarangay Official, Municipal
Official only
Forms, data entry, DANA templates, project updates,
DRRM reports, compliance tracking

## Layer 3: Core Intelligence
ModuleRoleHow They Interact
## M1 —
KlimaChat
(Routing Hub)
Central brain — every query passes
through M1 first. Classifies intent, selects
the right module, formats the final
Filipino-language response.
M1 receives all user messages → classifies
intent → calls M8 for location context →
routes to appropriate M2–M7/M11 module →
formats and returns layered response
## M8 — Location
## Intelligence
Location enrichment engine — runs
automatically in the background on every
query. Provides barangay-level
geographic context to all modules.
M8 is called by M1 on every query. Uses GPS
(if allowed) or cascading selection (Region
→ Province → Municipality → Barangay) to
scope all data responses
## Layer 4: Feature Modules
ModuleDomainAccess LevelPrimary Function
## M2 — Weather &
## Forecast
WeatherAll roles (depth varies)Real-time conditions, 3–10 day
forecasts, hourly data, El Niño/La
Niña indicators
## M3 — Hazard &
## Disaster Alerts
HazardAll roles (officials get
management tools)
Typhoon signals, flood/landslide/storm
surge warnings, evacuation center
lookup
## M4 — Safety
## Advisor
SafetyAll rolesTranslates hazard data into plain-
language Filipino safety guidance, go-
bag checklists, evacuation routes
## M5 — Agricultural
## Advisory
AgricultureFarmer, Barangay Official,
## Municipal Official (hidden
from Residents)
Crop-specific planting windows, pest/
disease alerts, harvest timing, PCIC
insurance reminders
## M6 — LGU
## Planning Toolkit
GovernanceBarangay Official
## (barangay), Municipal
Official (municipal) only
CDRA/LCCAP guided workflows,
hazard profiles, compliance
scorecards, deadline reminders
## M7 — DRRM
## Operations
## Disaster
## Response
## Barangay Official
## (barangay), Municipal
Official (municipal) only
Pre-disaster checklists, evacuation
management, DANA forms, relief
tracking, MDRRMC reporting
## M11 —
## Transparency
## Tracker
AccountabilityAll roles (Resident/Farmer:
view only; Officials: edit)
DRRM budget tracking, infrastructure
project status, community reporting/
flagging

## Layer 5: Data Layer
ComponentTypeContentsWho Uses It
## M9 — Climate
## Knowledge
## Base
## Indexed
document
store
PAGASA bulletins, HazardHunterPH
hazard maps, crop calendars, CDRA/
LCCAP templates, safety guides,
disaster SOPs
M1 draws from M9 to answer
all queries; all modules
reference M9 for context
## M10 —
## Analytics
## Dashboard
## Structured
queryable
datasets
Historical climate trends, hazard
frequency maps, DRRM fund
utilization charts, cross-barangay
compliance rankings
## Barangay Official (barangay
scope), Municipal Official
(municipal-wide). Hidden from
Residents and Farmers.
Layer 6: External APIs
API / SourceWhat It ProvidesFeeds IntoCoverage
PAGASA TenDay APIMunicipal-level weather
forecasts, seasonal outlooks,
climate projections (SSP
scenarios)
M2 (Weather), M5
(Agriculture), M9
(Knowledge Base)
## 10/10 —
municipal
(PSGC-aligned)
Open-MeteoHigh-resolution gridded
forecasts (7–16 day), ERA5
reanalysis, hourly data — no
API key needed
M2 (Weather), M8
(Location Intelligence)
8/10 — 1–9 km
resolution
Copernicus CDSERA5 reanalysis (1940–
present), ERA5-Land, long-
term climate baselines
M9 (Knowledge Base),
M10 (Analytics)
## 7/10 — 11–25
km
NASA POWERSolar irradiance, temperature,
precipitation, wind (MERRA-2)
M5 (Agriculture), M9
(Knowledge Base)
5/10 — ~50 km
NDRRMC FeedsActive disaster updates,
affected areas, casualty and
damage data — published per
event
M3 (Hazard Alerts), M7
(DRRM Operations), M9
(Knowledge Base)
## 10/10 —
national/
regional
HazardHunterPHFlood, landslide, storm surge,
earthquake hazard maps at
barangay level
M3 (Hazard Alerts), M6
(LGU Planning), M9
(Knowledge Base)
## 10/10 —
barangay level
LGU Open Data (DBM,
COA, Full Disclosure
## Policy)
Budget allocations, DRRM fund
utilization, audit reports,
infrastructure project records
M11 (Transparency
Tracker), M10 (Analytics)
## 10/10 —
municipal level

System Flow — 7-Step Query Journey
StepWhat HappensComponent
## Step
## 1
User sends a query (e.g., "Uulan ba mamaya?")Frontend — Chat
## Interface
## Step
## 2
Auth check — system confirms user's role (Resident, Farmer, Barangay
## Official, Municipal Official)
## Layer 1 —
## Authentication
## Step
## 3
M8 Location Intelligence auto-enriches query with user's barangay-level
location context
## M8 — Location
## Intelligence
## Step
## 4
M1 KlimaChat classifies user intent — determines which module should
handle the query (Weather? Hazard? Agriculture? DRRM?)
M1 — KlimaChat
(Routing Hub)
## Step
## 5
Appropriate feature module processes the query — retrieves data from
M9/M10 and external APIs
M2–M7 / M11 (Feature
## Modules)
## Step
## 6
Role filter applied — response is scoped to user's access level (e.g.,
Farmer gets crop advice; Resident gets general safety tip)
M1 — Role-Based
## Response Filter
## Step
## 7
Response delivered — concise, layered Filipino-language answer
returned to user in Chat Interface
## Frontend — Chat
## Interface
Data Flow — Read vs. Write Matrix
Data SourceResidentFarmerBarangay OfficialMunicipal Official
## M9 Climate
## Knowledge Base
Read onlyRead onlyRead onlyRead only
## M10 Analytics
## Dashboard
No accessNo accessRead only (barangay
scope)
Read only (municipal
scope)
## M11 Transparency
## Tracker
Read onlyRead onlyRead + Write (own
barangay)
## Read + Write (all
barangays)
DANA Forms (M7)No accessNo accessWrite (create/submit)Write + Approve
## (municipal)
## Evacuation Center
Data (M7)
Read onlyRead onlyRead + Write (own
barangay)
## Read + Write (all
barangays)
## Budget / Project Data
## (M11)
Read onlyRead onlyWrite (own barangay
data)
Write (full municipal
data)
## Community Reports
## (M11)
## Write (submit
report)
## Write (submit
report)
## Read + Respond
(own barangay)
## Read + Respond (all
barangays)
External API Data
## (M2/M3/M5)
Read onlyRead onlyRead onlyRead only

## Security Architecture
Security LayerMechanismApplies To
AuthenticationResidents/Farmers: AWS Cognito + OTP via AWS SNS (6-digit
code, 5-min expiry, 3-attempt lockout). Officials: username +
password (pre-assigned by admin).
All users on login
AuthorizationRole-based access control (RBAC) via AWS IAM policies —
each role can only access its permitted modules and data scope
All API calls and
data queries
## Location
scoping
All data queries filtered by user's assigned location — cross-
municipality access blocked at database query level
All data reads and
writes
## Encryption (at
rest)
AES-256 encryption — all data at rest in AWS S3 + DynamoDBAll stored data
## Encryption (in
transit)
HTTPS / TLS 1.3 — all data encrypted in transit between client
and server
All network requests
Audit trailEvery official data edit logged: WHO changed it, WHEN, and
WHAT was changed. Version history retained. Powered by AWS
CloudTrail.
Barangay and
## Municipal Officials
only
HashingMobile numbers stored as one-way hash — cannot be reverse-
engineered. OTP verification only.
Resident/Farmer
mobile numbers
## Session-only
chat
Chat conversations NOT permanently stored — cleared when
session ends. No chat history retained server-side.
All roles
## Anonymous
reporting
Community reports submitted by Residents/Farmers carry no
identity — only barangay location and report content are stored
Resident and
Farmer community
reports
## Architecture Summary
LayerNameKey ComponentsPrimary Function
Layer 1Users &
## Authentication
Resident Account, Farmer Profile Add-On,
## Barangay Official Account, Municipal Official
## Account
Four role contexts entering
through OTP or username/
password authentication
Layer 2FrontendChat Interface, Dashboard View, Emergency
## Alert View, Admin Panel
Browser-based web
application rendering chat UI
and role-specific views
Layer 3Core
## Intelligence
M1 KlimaChat (routing hub) ↔ M8 Location
## Intelligence
Classifies intent, enriches
query with location, routes to
correct feature module
Layer 4Feature
## Modules
## M2 Weather, M3 Hazard, M4 Safety, M5
Agriculture, M6 LGU Planning, M7 DRRM
## Ops, M11 Transparency
Intent-specific processing —
each module handles a
distinct query domain

LayerNameKey ComponentsPrimary Function
Layer 5Data LayerM9 Climate Knowledge Base, M10
## Analytics Dashboard
Indexed document knowledge
+ structured queryable
datasets powering all
responses
Layer 6External APIsPAGASA, Open-Meteo, Copernicus CDS,
## NASA POWER, NDRRMC,
HazardHunterPH, LGU Open Data
Real-time and historical
climate data feeds
continuously refreshing the
knowledge base
SecuritySecurity
## Architecture
Auth (OTP/password), RBAC, location
scoping, AES-256 encryption, TLS 1.3,
audit trail, hashing, session-only chat,
anonymous reporting
End-to-end protection from
user authentication through to
data storage and access
control

08 — External Data Sources & APIs
All external APIs used by KlimaGuard PH are free and verified. No paid APIs are required for the
hackathon build.
API / SourceWhat It ProvidesCostRate LimitPH Coverage
PAGASA TenDay APIMunicipal-level weather
forecasts, seasonal outlooks,
climate projections (SSP
scenarios)
Free100 burst /
1,000 daily
## 10/10 —
municipal
## (PSGC-
aligned)
Open-MeteoHigh-resolution gridded
forecasts (7–16 day), ERA5
reanalysis, hourly data — no
API key needed
## Free (non-
commercial)
## ~10,000/
day
## 8/10 — 1–9
km resolution
Copernicus CDSERA5 reanalysis (1940–
present), ERA5-Land, long-
term climate baselines — free
registration required
FreeQueue-
based
## (batch)
## 7/10 — 11–25
km
NASA POWERSolar irradiance, temperature,
precipitation, wind (MERRA-2)
— no API key needed
FreeNo formal
limit
## 5/10 — ~50
km
NDRRMC FeedsActive disaster updates,
affected areas, casualty and
damage data — published per
event
FreePublished
per event
## 10/10 —
national/
regional
HazardHunterPHFlood, landslide, storm surge,
earthquake hazard maps at
barangay level — web-based,
pre-load into Knowledge Base
FreeWeb-based10/10 —
barangay level
LGU Open Data
(DBM, COA, Full
## Disclosure Policy)
Budget allocations, DRRM fund
utilization, audit reports,
infrastructure project records
## Free (public
records)
No formal
limit
## 10/10 —
municipal
level
Demo Strategy for the Hackathon: Focus deep data on Eastern Visayas (Region VIII) — Leyte,
Samar, Biliran. This region is typhoon-prone, has active farming communities, and strong LGU DRRM
operations — enabling all three roles to be demoed convincingly with one geographic focus.
Nationwide scalability is addressed in the pitch.

09 — M11 Transparency Tracker — Location-Based Rules
The Transparency Tracker data is entirely location-specific. Every municipality has its own budget,
projects, and spending records. The system uses one database filtered by location — not separate
databases per location.
## What Data Changes Per Location
## Data Type
## Location
## Level
Why It DiffersExample
DRRM Fund
## Allocation
MunicipalEach municipality receives different IRA
→ different 5% DRRM allocation
Tacloban: ₱12.5M vs
Ormoc: ₱8.7M
DRRM Fund
## Spending
MunicipalEach municipality spends differentlyTacloban: 66% utilized vs
## Ormoc: 45%
## Infrastructure
## Projects
BarangayEach barangay has its own flood control,
drainage, seawall projects
## Brgy. San Jose: Seawall
85% done
## Community
## Reports
BarangayCitizens report issues in their own
barangay only
"Seawall sa Brgy. San
Jose hindi pa tapos"
## Calamity / Relief
## Fund
MunicipalTriggered per disaster event per
municipality
## Tacloban Typhoon Aghon
relief: ₱2.3M spent
Permissions by Role and Location
ActionResidentFarmer
## Barangay
## Official
## Municipal
## Official
View budget of own municipality✓✓✓✓
View projects in own barangay✓✓✓✓
View projects in other barangays (same
municipality)
## ✓✓✓✓
View data from other municipalities✗✗✗✗
Submit community report (own barangay)✓✓✓✓
Submit community report (any barangay)✗✗✗✓
Respond to / resolve community reports✗✗✓ Own
barangay
✓ Any barangay
Update project status✗✗✓ Own
barangay
✓ Any barangay

ActionResidentFarmer
## Barangay
## Official
## Municipal
## Official
Upload municipal budget data✗✗✗✓ Municipal
level
## M11 Data Sources
SourceWhat It ProvidesHow It Enters KlimaGuard PH
DBM (Dept. of Budget &
## Management)
National/regional budget allocations,
IRA per municipality
Pre-loaded from Full Disclosure
Policy public data
LGU Full Disclosure PolicyMunicipal budget, DRRM fund
allocation, project lists, AIP
Pre-loaded; officials can update via
## M11
COA (Commission on Audit)Audit reports, fund utilization recordsPre-loaded from published audit
reports
## Barangay / Municipal
## Officials
Project status updates, completion
%, spending reports
Officials upload or update directly
through M11
Citizens (Community
## Reports)
Ground-truth verification of project
completion
Residents/farmers submit reports
tied to their barangay
Key Rule: No user — regardless of role — can view or edit data from a municipality other than their
own. This is enforced at the database query level.

## 10 — Module 6 & 7 — Detailed Breakdown
M6 — LGU Planning Toolkit
Main function: Helps officials create and manage mandatory climate governance documents required
by Philippine law (RA 9729 and RA 10121). M6 is the blueprint — long-term planning scope (months/
years).
FeatureWhat It DoesReal Problem It SolvesLegal Basis
CDRA Guided
## Workflow
Step-by-step through the 6-step
## Climate & Disaster Risk
Assessment (CCC-HLURB
methodology)
LGUs hire expensive
consultants or copy-
paste from other LGUs
## RA 10121,
## CCC-HLURB
LCCAP Guided
## Workflow
Helps create the 5-section Local
## Climate Change Action Plan (9-
step process)
Only ~90% of LGUs
have LCCAPs; many
are outdated or copy-
paste
## RA 9729
(Climate
## Change Act)
## Barangay / Municipal
## Hazard Profile
Auto-generated hazard summary
using HazardHunterPH + MGB +
PHIVOLCS data
Officials don't know
which hazards
specifically threaten
their area
## DILG SGLG
requirement
Climate ProjectionsProjected temperature, rainfall,
sea-level change for planning
Plans are made without
climate data — future
risks are ignored
## CCC
## NICCDIES
Compliance ScorecardTracks LGU compliance with DILG
SGLG requirements (LCCAP,
CDRA, DRRM Plan)
Officials miss deadlines
and lose SGLG
eligibility
## DILG SGLG
indicators
## Compliance Deadline
## Reminders
Auto-alerts at 30/15/7 days before
LCCAP updates, SGLG
submission
Deadlines are forgotten
until the last minute
## CCC, DILG
circulars
CLUP Integration
(Municipal only)
## Climate-informed Comprehensive
## Land Use Plan
CLUP is created
without climate hazard
data
## HLURB /
## DHSUD
CCET — Climate
## Change Expenditure
Tagging (Municipal
only)
Tag municipal budget line items to
climate adaptation / mitigation
Climate spending is not
tracked or reported
## CCC
## NICCDIES
portal

M7 — DRRM Operations
Main function: Provides operational tools for disaster response — before, during, and after a disaster.
M7 is the action plan — operational scope (hours/days). The BDRRMC initial report is due to
MDRRMC within 3 hours of a disaster event.
## Feature
## When
## Used
What It DoesLegal / Protocol Basis
Pre-Disaster ChecklistBefore
disaster
Auto-generated action list: alert residents,
check evacuation centers, pre-position
relief goods, activate hotlines
RA 10121 Sec. 12 —
BDRRMC contingency
plans
## Evacuation Center
## Management
## During
disaster
Track capacity, occupancy, supplies at
each center; Municipal sees all centers
across all barangays
NDRRMC camp
coordination protocols
DANA Form (Damage
Assessment and
## Needs Analysis)
## After
disaster
Auto-generated template: affected
population, casualties, housing damage,
infrastructure, agriculture — 3-hour initial
report deadline
## NDRRMOC SOPG
## 2024
## Resource / Relief
## Goods Inventory
## Before /
during
Track available relief goods, rescue
equipment, medical supplies; Municipal
sees all warehouses
## RA 10121 —
LDRRMO must
maintain resource
databases
## Affected Population
## Tracker
## During /
after
Estimate families in hazard zones, track
evacuees, identify unaccounted persons
NDRRMC 14 Essential
Elements of
## Information
## Relief Distribution
## Tracker
## After
disaster
Monitor food packs, NFIs distributed vs.
needed; per-barangay breakdown for
municipal
## DSWD DROMIC
system compliance
## MDRRMC / PDRRMC
## Reporting
## During /
after
Auto-formatted situation reports for
upward chain: BDRRMC → MDRRMC →
## PDRRMC → NDRRMC
## NDRRMOC SOPG
tiered reporting chain
## QRF / LDRRMF
## Tracker
## Before /
after
Track 30% QRF activation and spending;
Municipal tracks full 70/30 LDRRMF split
RA 10121 Sec. 21 —
70/30 LDRRMF rule
M6 vs. M7 Comparison
DimensionM6 — LGU Planning ToolkitM7 — DRRM Operations
When is it
used?
Before disasters (long-term planning)Before, during, and after disasters (operational)
PurposeCreate compliance documents and
plans
Execute disaster response actions

DimensionM6 — LGU Planning ToolkitM7 — DRRM Operations
TimeframeMonths / years (CDRA, LCCAP,
compliance)
Hours / days (checklists, DANA, evacuation)
Think of it asThe blueprintThe action plan
Example query"Help me create our LCCAP""Signal #2 — give me the pre-disaster checklist
## NOW"
Legal basisRA 9729 (Climate Change Act)RA 10121 (DRRM Act)
FrequencyQuarterly / annuallyDuring every disaster event
RelationshipM6 creates the plans — M7 executes them when disaster strikes

## 11 — Chat Agent Persona & Guardrails
## Agent Persona Definition
KlimaGuard is not a government portal. It is a trusted neighbor who always knows the weather and
keeps everyone safe — warm, direct, and approachable.
DimensionDefinition
NameKlimaGuard
Identity"Your Climate Buddy" — a friendly, knowledgeable Filipino climate assistant
ToneWarm, casual, conversational — like a trusted neighbor who always knows the
weather
LanguageFilipino by default; switches to English only if the user initiates in English; supports
Tagalog naturally
Personality TraitsHelpful, calm, reassuring during emergencies, action-oriented, never condescending
Response StyleConcise (1–2 sentences first); avoids jargon; leads with "so what," not raw data
Greeting"Kumusta! Ako si KlimaGuard ️ Anong gusto mong malaman ngayon?"
## Emergency Tone
## Shift
Urgent but calm; prioritizes safety actions over data; uses red alert framing
Error Handling"Pasensya na, hindi ko pa nakukuha ang data na 'yan. Puwede mong i-try ulit
mamaya!"
## Layered Response Model
LayerNameWhat Happens
L1Quick AnswerDirect, 1–2 sentence response in Filipino. Leads with the "so what," not the data.
L2Follow-up
## Prompt
One optional next step — not a menu. The user decides whether to go deeper.
L3Deep DiveDetailed data, charts, or dashboard links — only surfaced when the user
explicitly asks.
## 12 Safety Guardrails
CodeGuardrailRuleExample
G01Scope
## Boundary
ONLY answer climate, weather,
disaster, agriculture, and LGU
planning queries. Decline everything
else politely.
User: "Ano ang score ng Gilas?" →
"Pasensya, weather at climate lang
ang expertise ko!"

CodeGuardrailRuleExample
G02No Medical
## Advice
Never give medical recommendations,
even during disasters. Redirect to
DOH or emergency services.
"Tumawag ka agad sa 911 o Red
Cross 143. Hindi ako doctor."
G03No Political
## Commentary
Never comment on political figures or
government performance. Share only
factual budget data from M11.
User: "Corrupt ba ang mayor?" →
"Hindi ko kayang mag-comment. Pero
ito ang DRRM budget..."
G04Data AttributionAlways cite data source when
providing climate information.
"Ayon sa PAGASA, Signal #2 ang
Leyte ngayon..."
G05Uncertainty
## Disclosure
When data confidence is low, say so.
Never present uncertain forecasts as
definitive.
"Ang forecast ay may 40% chance of
rain — hindi pa sigurado. I-check mo
ulit bukas."
G06Data Collection
## Limit
For residents: phone number for OTP
only. Never ask for names, addresses,
or government IDs.
"Hindi kailangan ng pangalan! I-allow
mo lang ang location access."
G07Emergency
## Priority Override
If the user is in an active disaster
zone, ALWAYS prioritize safety
information regardless of what they
asked.
User asks about crops but is in Signal
#3 area → "Sandali — may Signal #3
sa area mo. Ligtas ka ba?"
G08Response
## Length Limit
Max 3 sentences for Layer 1. Never
exceed 5 sentences unless user
explicitly requests deep dive.
Keep it short. If the user wants more,
they'll ask.
G09Language
## Respect
Match the user's language. If they
speak Cebuano, respond in Cebuano.
Never correct grammar.
User: "Moulan ba ugma?" (Cebuano)
→ respond in Cebuano
G10Graceful
## Fallback
Admit when data is unavailable. Never
make up data.
"Wala pa akong data para sa specific
na barangay na 'yan. Pero ito ang
forecast para sa buong municipality..."
G11Freshness
## Disclosure
Always indicate when data was last
updated. Never present stale data as
current.
"Last updated: 6:00 AM today
(PAGASA). Ang next update ay 12:00
## NN."
G12Age-
## Appropriate
All responses must be suitable for all
ages. No graphic disaster imagery
descriptions.
Describe hazards factually, non-
sensationally. Focus on actions, not
fear.

12 — UI Design (Web Application)
KlimaGuard PH is built as a web application accessible on any device through a browser. It uses a
deep navy and teal palette to convey trust and clarity — deliberately avoiding the visual language of
government portals in favor of a modern, approachable utility.
Web App UI Mockup
Figure 1 — KlimaGuard PH Web App Mockup • Home/Dashboard • Chat Conversation • Emergency Alert
Screen-by-Screen Description
ScreenWhat It ShowsDesign Purpose
## Screen 1 —
## Home/
## Dashboard
Full sidebar navigation with module links; split
panel with embedded chat widget on the left
and weather/alert dashboard cards on the
right; quick action buttons (Weather, Alerts,
Farming, LGU, DRRM)
Gives power users an at-a-glance view
while keeping the chat as the primary
interaction point. No role selection
required — any user can start
immediately.
## Screen 2 —
## Chat
## Conversation
Full-width chat interface showing an active
Filipino-language conversation about Leyte
weather; embedded weather card (32°C,
Sunny, 78% humidity, 60% rain chance);
single follow-up suggestion chip
Demonstrates the layered response
model in action — the user gets a
clean answer and exactly one next
step. No information overload.

ScreenWhat It ShowsDesign Purpose
## Screen 3 —
## Emergency Alert
Full-width red alert banner for Typhoon Signal
#2; alert details card showing affected area,
nearest evacuation center with distance and
capacity; map widget; floating chat widget
Red is reserved exclusively for disaster/
typhoon scenarios. Safety information
is foregrounded; chat stays available
for follow-up questions.

13 — SDLC — Rapid Workflow Cycle
Traditional SDLC approaches cannot operate within a 12-hour overnight hackathon. The Rapid
Workflow Cycle compresses the entire development lifecycle into tight, repeatable 60–90 minute
micro-cycles, each producing a shippable, demoable increment.
Mantra: "Every 90 minutes, we have a better product than 90 minutes ago."
Cycle: BUILD (40 min) → TEST (10 min) → SHIP (10 min) → REVIEW (5 min)
12-Hour Cycle Plan
## Cycle
## Time
## Block
Module(s)Shippable Output
## Cycle
## 0
Hour 0–0.5SetupEmpty app shell running; repo and Quick Space created
## Cycle
## 1
Hour 0.5–2M1 + M9Agent responds to "Kumusta!" in Filipino with layered persona
## Cycle
## 2
Hour 2–3.5M2 + M8Agent answers "Uulan ba mamaya sa Leyte?" with real weather data
## Cycle
## 3
Hour 3.5–5M3 + M4Agent handles "May bagyo ba?" with alert card + nearest evacuation
center
## Cycle
## 4
Hour 5–6.5M5Agent answers "Okay ba magtanim ng palay?" with crop-specific
advice
## Cycle
## 5
Hour 6.5–8M11Agent answers "Saan napunta ang DRRM funds?" with budget data
## Cycle
## 6
Hour 8–9M6 + M7Agent provides CDRA guidance and DRRM checklists (lightweight)
## Cycle
## 7
Hour 9–10UI PolishProfessional-looking, demo-ready web app
## Cycle
## 8
## Hour 10–
## 11
SubmissionVideo uploaded, submission form complete
## Cycle
## 9
## Hour 11–
## 12
Pitch PrepTeam confident and ready to present

Kill List — What to Cut If Behind
## Cut
## Order
Module to DropWhen to Cut
1st CutM10 — Analytics DashboardIf behind by Cycle 4 — low demo impact; mention as
"future feature"
2nd CutM6 + M7 — LGU Planning +
DRRM Ops
If behind by Cycle 5 — show as pre-loaded templates
3rd CutM11 — Transparency TrackerIf behind by Cycle 6 — describe with mockup data, don't
build full integration
4th CutM5 — Agricultural AdvisoryIf behind by Cycle 7 — demo with 1–2 hardcoded crop
responses
NEVER CUT: M1 (KlimaChat) + M2 (Weather) + M3 (Hazard Alerts) + M4 (Safety Advisor) + M8
(Location) + M9 (Knowledge Base) — without these six, there is nothing to demo.

## 14 — Competitive Advantage
KlimaGuard PH is the only platform in the Philippine climate data ecosystem that combines: a Filipino-
first conversational AI chat agent, role-based feature access for four distinct user types, location-
specific data filtering, and a government accountability tracker (M11) — all in one unified web
application.
## Capability Comparison
CapabilityProject NOAHHazardHunterPHPAGASAHandaKlimaGuard PH
## Hazard Coverage6.09.05.57.08.0
## Mobile Access4.05.57.05.09.0
LGU Usability6.05.05.05.08.5
## Data Integration5.08.06.07.08.5
## Language Support3.53.54.05.08.5
## Offline Capability1.51.51.51.58.0
Scores are out of 10. All existing platforms score 1.5/10 on offline capability. KlimaGuard PH targets 8.0/10 through
PWA caching and low-bandwidth mode.
## Key Differentiators
DifferentiatorWhy It Matters
First unified platform in the
## Philippines
No existing tool integrates weather + hazards + agriculture + LGU planning +
transparency in one place. Users currently navigate 4+ separate systems.
Filipino-first language
## (8.5/10)
Every existing tool is English-only. All competitors score 3.5–5.0 on language
support. KlimaGuard PH targets 8.5.
Offline capability via PWA
## (8.0/10)
All existing tools score 1.5/10 offline. KlimaGuard PH caches evacuation
centers, hotlines, safety protocols, and last-known hazard data offline.
M11 Transparency TrackerNo competitor tracks government budget or project accountability. Inspired
by Naga City's budget portal — makes public data conversational and
accessible to every resident.
Role-based intelligence with
read-only citizen design
Residents and Farmers consume guidance with no data entry burden.
Officials manage data. The same platform serves all four roles without
confusing non-technical users.
Crop-specific agricultural
advisories
No existing Philippine climate tool provides Filipino-language, crop-specific,
location-based farming advice to the ~10M family farmers who need it most.

## Favorable Market Timing
The Philippine government is actively investing in this space: the ₱1B Project NOAH revival (August
2026), the Handa platform (March 2026), and the PANaHON app (June 2026). KlimaGuard PH
positions itself as a complementary aggregation layer — unifying what these platforms produce into
one conversational interface for every Filipino.