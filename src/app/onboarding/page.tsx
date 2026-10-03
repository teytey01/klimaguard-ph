"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AppHeader,
  HotlineFooter,
  Icon,
  useAuth,
  useLanguage,
} from "@/components/common";
import { formatPhMobile } from "@/lib/sms";
import {
  DEFAULT_ONBOARDING,
  ROLE_CARDS,
  CROP_OPTIONS,
  STAGE_OPTIONS,
  PH_REGIONS,
  osmEmbedUrl,
} from "@/lib/onboarding/onboardingData";
import type {
  IAuthSession,
  IconName,
  ICropChoice,
  IGrowthStage,
  IOnboardingState,
  IUserRole,
} from "@/types";
import type { ITranslationKey } from "@/lib/i18n";

const TOTAL_STEPS = 4;

/**
 * The 4-step onboarding flow matching the Stitch design:
 * 1) role selection, 2) location (defaults to Calamba/Santa Cruz, Laguna),
 * 3) role details (resident household / farmer crop), 4) permissions.
 * State is kept in a local draft; the verified session (name + mobile) comes
 * from AuthProvider. Resident is the fully-built path; other roles reuse the
 * generic detail step. Filipino-first via the language dictionaries.
 */
export default function OnboardingPage() {
  const { session, ready } = useAuth();
  const router = useRouter();

  // Signed out → sign-in. Officials are pre-onboarded by their admin, so they
  // (and residents who already finished) go straight to the dashboard.
  const isOfficial = session?.role === "barangay" || session?.role === "lgu";
  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session?.verified) {
      router.replace("/signin");
    } else if (isOfficial || session.onboarded) {
      router.replace("/dashboard");
    }
  }, [ready, session, isOfficial, router]);

  if (!ready || !session?.verified || isOfficial || session.onboarded) {
    return <div className="min-h-screen bg-surface-2" aria-hidden="true" />;
  }

  // Keyed on the user id so the draft initializes from this user's profile.
  return <OnboardingFlow key={session.id ?? "session"} session={session} />;
}

interface IOnboardingFlowProps {
  session: IAuthSession;
}

function OnboardingFlow({ session }: IOnboardingFlowProps) {
  const { t } = useLanguage();
  const { signIn, signOut } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IOnboardingState>(() => ({
    ...DEFAULT_ONBOARDING,
    role: session.role === "farmer" ? "farmer" : null,
    // Start from the server-saved location (defaults to Calamba, Laguna).
    location: session.location ?? DEFAULT_ONBOARDING.location,
    smsNumber: session.mobile,
  }));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const percent = Math.round(((step - 1) / TOTAL_STEPS) * 100);

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  /** Officials can't self-register: sign out and send them to Official login. */
  async function goToOfficialLogin() {
    await signOut();
    router.replace("/signin");
  }

  async function finish() {
    setSaving(true);
    setSaveError(null);
    const isFarmer = draft.role === "farmer";
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: isFarmer ? "farmer" : "resident",
          ...draft.location,
          primaryCrop: isFarmer ? (draft.farmer?.crop ?? "rice") : undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        session?: IAuthSession;
        error?: string;
      } | null;
      if (!res.ok || !body?.session) {
        setSaveError(body?.error ?? t("ob.perm.saveError"));
        setSaving(false);
        return;
      }
      signIn(body.session);
      router.replace("/dashboard");
    } catch {
      setSaveError(t("ob.perm.saveError"));
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <AppHeader />

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          {/* Progress header */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-teal">
              <span>{t("ob.stepOf", { current: step, total: TOTAL_STEPS })}</span>
              <span className="text-cmd-muted">
                {t("ob.percentComplete", { percent })}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cmd-tile">
              <div
                className="h-full rounded-full bg-teal transition-all"
                style={{ width: `${Math.max(6, percent)}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {step === 1 ? (
            <RoleStep
              selected={draft.role}
              onSelect={(role) => setDraft((d) => ({ ...d, role }))}
              onNext={next}
              onOfficialLogin={goToOfficialLogin}
            />
          ) : null}

          {step === 2 ? (
            <LocationStep
              location={draft.location}
              setDraft={setDraft}
              onBack={back}
              onNext={next}
            />
          ) : null}

          {step === 3 ? (
            <DetailsStep
              role={draft.role}
              draft={draft}
              setDraft={setDraft}
              smsNumber={session.mobile}
              onBack={back}
              onNext={next}
            />
          ) : null}

          {step === 4 ? (
            <PermissionsStep
              draft={draft}
              setDraft={setDraft}
              name={session.name}
              mobile={session.mobile}
              saving={saving}
              saveError={saveError}
              onBack={back}
              onFinish={finish}
            />
          ) : null}
        </div>
      </main>

      <HotlineFooter />
    </div>
  );
}

// --- Step 1: Role selection ---

interface IRoleStepProps {
  selected: IUserRole | null;
  onSelect: (role: IUserRole) => void;
  onNext: () => void;
  /** Sends a would-be official to the Official sign-in tab. */
  onOfficialLogin: () => void;
}

function RoleStep({ selected, onSelect, onNext, onOfficialLogin }: IRoleStepProps) {
  const { t } = useLanguage();
  const officialPicked = selected === "barangay" || selected === "lgu";

  return (
    <section>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-teal">
        <span className="inline-block size-2 rounded-full bg-teal" />
        {t("ob.role.badge")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-cmd-heading sm:text-3xl">
        {t("ob.role.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-cmd-muted">
        {t("ob.role.subtitle")}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLE_CARDS.map((card) => {
          const isSelected = selected === card.role;
          return (
            <button
              key={card.role}
              type="button"
              onClick={() => onSelect(card.role)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-start rounded-xl border p-5 text-left transition-colors ${
                isSelected
                  ? "border-teal bg-cmd-tile"
                  : "border-black/10 dark:border-white/10 bg-cmd-surface hover:border-white/25"
              }`}
            >
              {card.priority ? (
                <span className="absolute right-4 top-4 rounded-full bg-cmd-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cmd-accent">
                  {t("ob.role.farmerPriority")}
                </span>
              ) : null}
              {isSelected ? (
                <span className="absolute right-4 top-4 text-teal">
                  <Icon name="check" size={20} />
                </span>
              ) : null}

              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-cmd-tile text-teal">
                <Icon name={card.icon} size={22} />
              </span>

              <div className="mt-3 flex items-center gap-2">
                <h2 className="text-base font-semibold text-cmd-heading">
                  {t(card.titleKey)}
                </h2>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
                  {t(card.tagKey)}
                </span>
              </div>
              <p className="mt-2 text-sm text-cmd-muted">{t(card.descKey)}</p>
              <span className="mt-3 flex items-center gap-1 text-xs font-medium text-teal">
                {t(card.linkKey)}
                <Icon name="arrow-right" size={13} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Zero friction strip */}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-cmd-surface p-4">
        <span className="mt-0.5 text-teal">
          <Icon name="wifi" size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-cmd-heading">
            {t("ob.role.zeroFriction")}
          </p>
          <p className="mt-0.5 text-xs text-cmd-muted">
            {t("ob.role.zeroFrictionDesc")}
          </p>
        </div>
        <dl className="hidden gap-6 text-right sm:flex">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-cmd-muted">
              {t("ob.role.storageNeeded")}
            </dt>
            <dd className="text-sm font-bold text-teal">&lt; 150 KB</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-cmd-muted">
              {t("ob.role.syncLatency")}
            </dt>
            <dd className="text-sm font-bold text-teal">
              {t("ob.role.realtime")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Official roles are admin-created — residents can't self-assign them. */}
      {officialPicked ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-cmd-accent/40 bg-cmd-accent/10 p-4">
          <span className="text-cmd-accent">
            <Icon name="lock" size={18} />
          </span>
          <p className="min-w-0 flex-1 text-sm text-cmd-heading">
            {t("ob.role.officialOnly")}
          </p>
          <button
            type="button"
            onClick={onOfficialLogin}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-cmd-accent px-4 py-2 text-sm font-semibold text-cmd-accent-text hover:opacity-90"
          >
            {t("ob.role.officialSwitch")}
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-cmd-muted">
          <Icon name="lock" size={13} />
          {t("ob.role.privacyFooter")}
        </p>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected || officialPicked}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          {t("ob.role.continue")}
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </section>
  );
}

// --- Step 2: Location ---

interface ILocationStepProps {
  location: IOnboardingState["location"];
  setDraft: React.Dispatch<React.SetStateAction<IOnboardingState>>;
  onBack: () => void;
  onNext: () => void;
}

const SELECT_CLASS =
  "mt-1 w-full appearance-none rounded-md border border-black/10 bg-cmd-tile px-3 py-2.5 text-sm font-medium text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/10";

function LocationStep({
  location,
  setDraft,
  onBack,
  onNext,
}: ILocationStepProps) {
  const { t } = useLanguage();

  // Resolve the current selections against the dataset.
  const region =
    PH_REGIONS.find((r) => r.name === location.region) ?? PH_REGIONS[0];
  const province =
    region.provinces.find((p) => p.name === location.province) ??
    region.provinces[0];
  const municipality =
    province.municipalities.find((m) => m.name === location.municipality) ??
    province.municipalities[0];

  function update(patch: Partial<IOnboardingState["location"]>) {
    setDraft((d) => ({ ...d, location: { ...d.location, ...patch } }));
  }

  function onRegionChange(name: string) {
    const r = PH_REGIONS.find((x) => x.name === name) ?? PH_REGIONS[0];
    const p = r.provinces[0];
    const m = p.municipalities[0];
    update({
      region: r.name,
      province: p.name,
      municipality: m.name,
      barangay: m.barangays[0],
    });
  }
  function onProvinceChange(name: string) {
    const p =
      region.provinces.find((x) => x.name === name) ?? region.provinces[0];
    const m = p.municipalities[0];
    update({ province: p.name, municipality: m.name, barangay: m.barangays[0] });
  }
  function onMunicipalityChange(name: string) {
    const m =
      province.municipalities.find((x) => x.name === name) ??
      province.municipalities[0];
    update({ municipality: m.name, barangay: m.barangays[0] });
  }

  // Coastal/riverine municipalities get the fluvial signal strip.
  const isRiverine = municipality.name === "Santa Cruz";

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal">
            <Icon name="location" size={14} />
            {t("ob.loc.badge")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-cmd-heading sm:text-3xl">
            {t("ob.loc.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cmd-muted">
            {t("ob.loc.subtitle")}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-teal/40 bg-cmd-surface px-4 py-2.5 text-sm font-medium text-teal hover:bg-cmd-tile"
        >
          <Icon name="location" size={16} />
          <span className="text-left">
            {t("ob.loc.useGps")}
            <span className="block text-[10px] font-normal text-cmd-muted">
              {t("ob.loc.gpsSync")}
            </span>
          </span>
        </button>
      </div>

      {/* Cascading selects */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="rounded-lg bg-cmd-surface p-3 text-xs text-cmd-muted">
          {t("ob.loc.region")}
          <div className="relative">
            <select
              value={region.name}
              onChange={(e) => onRegionChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {PH_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cmd-muted">
              <Icon name="chevron-down" size={16} />
            </span>
          </div>
        </label>

        <label className="rounded-lg bg-cmd-surface p-3 text-xs text-cmd-muted">
          {t("ob.loc.province")}
          <div className="relative">
            <select
              value={province.name}
              onChange={(e) => onProvinceChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {region.provinces.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cmd-muted">
              <Icon name="chevron-down" size={16} />
            </span>
          </div>
        </label>

        <label className="rounded-lg bg-cmd-surface p-3 text-xs text-cmd-muted">
          {t("ob.loc.municipality")}
          <div className="relative">
            <select
              value={municipality.name}
              onChange={(e) => onMunicipalityChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {province.municipalities.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cmd-muted">
              <Icon name="chevron-down" size={16} />
            </span>
          </div>
        </label>

        <label className="rounded-lg bg-cmd-surface p-3 text-xs text-cmd-muted">
          {t("ob.loc.barangay")}
          <div className="relative">
            <select
              value={location.barangay}
              onChange={(e) => update({ barangay: e.target.value })}
              className={SELECT_CLASS}
            >
              {municipality.barangays.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cmd-muted">
              <Icon name="chevron-down" size={16} />
            </span>
          </div>
        </label>
      </div>

      {/* Signal zone strip (riverine municipalities only) */}
      {isRiverine ? (
        <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-alert/40 bg-cmd-surface p-4">
          <span className="mt-0.5 text-alert">
            <Icon name="alert-triangle" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-cmd-heading">
              {municipality.name}, {province.name}
              <span className="rounded bg-alert px-1.5 py-0.5 text-[10px] font-bold text-white">
                SIGNAL #2 ZONE
              </span>
              <span className="text-[10px] font-semibold text-cmd-muted">
                PAGASA Advisory
              </span>
            </p>
            <p className="mt-1 text-xs text-cmd-muted">
              {location.barangay}: Katabi ng Santa Cruz River. Mataas ang
              peligro ng pag-apaw sa low-lying farming strips.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-cmd-muted">
              {t("ob.loc.respondersStandby")}
            </p>
            <p className="text-xs font-semibold text-teal">MDRRMO Station 1</p>
          </div>
        </div>
      ) : null}

      {/* Map + water level */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl bg-cmd-surface p-4 lg:col-span-2">
          <div className="h-56 w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <iframe
              key={`${municipality.lat},${municipality.lon}`}
              title={`${municipality.name} map`}
              src={osmEmbedUrl(municipality.lat, municipality.lon)}
              className="h-full w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-cmd-muted">
            <Icon name="water" size={13} />
            {municipality.name}, {province.name} · {t("ob.loc.liveNode")}
          </p>
        </div>
        <div className="rounded-xl bg-cmd-surface p-4">
          <p className="text-xs text-cmd-muted">{t("ob.loc.waterLevel")}</p>
          <p className="mt-1 text-3xl font-bold text-cmd-accent">
            4.82
            <span className="ml-1 text-sm font-medium text-cmd-muted">
              metro (+0.4m/hr)
            </span>
          </p>
          <p className="mt-2 text-xs text-cmd-muted">
            {t("ob.loc.critical", { value: "5.50m" })} ·{" "}
            {t("ob.loc.updated", { time: "2 mins ago" })}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-cmd-muted hover:text-cmd-heading"
        >
          <Icon name="arrow-left" size={16} />
          {t("ob.back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          {t("ob.loc.continue")}
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </section>
  );
}

// --- Step 3: Role details ---

interface IDetailsStepProps {
  role: IUserRole | null;
  draft: IOnboardingState;
  setDraft: React.Dispatch<React.SetStateAction<IOnboardingState>>;
  smsNumber?: string;
  onBack: () => void;
  onNext: () => void;
}

function DetailsStep({
  role,
  draft,
  setDraft,
  smsNumber,
  onBack,
  onNext,
}: IDetailsStepProps) {
  const { t } = useLanguage();
  const isFarmer = role === "farmer";

  const crop = draft.farmer?.crop ?? "rice";
  const stage = draft.farmer?.stage ?? "harvest";
  const householdSize = draft.resident?.householdSize ?? 4;
  const hasVulnerable = draft.resident?.hasVulnerableMembers ?? false;

  function setCrop(next: ICropChoice) {
    setDraft((d) => ({ ...d, farmer: { crop: next, stage } }));
  }
  function setStage(next: IGrowthStage) {
    setDraft((d) => ({ ...d, farmer: { crop, stage: next } }));
  }

  return (
    <section>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-teal">
        <Icon name="leaf" size={14} />
        {t("ob.details.badge")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-cmd-heading sm:text-3xl">
        {isFarmer ? t("ob.details.farmerTitle") : t("ob.details.residentTitle")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-cmd-muted">
        {isFarmer
          ? t("ob.details.farmerSubtitle")
          : t("ob.details.residentSubtitle")}
      </p>

      {isFarmer ? (
        <>
          <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-cmd-muted">
            {t("ob.details.mainCrop")}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CROP_OPTIONS.map((opt) => {
              const isSel = crop === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCrop(opt.value)}
                  aria-pressed={isSel}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    isSel
                      ? "border-teal bg-cmd-tile"
                      : "border-black/10 dark:border-white/10 bg-cmd-surface hover:border-white/25"
                  }`}
                >
                  <span className="text-teal">
                    <Icon name={opt.icon} size={22} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-cmd-heading">
                      {t(opt.labelKey)}
                    </span>
                  </span>
                  {isSel ? (
                    <span className="text-teal">
                      <Icon name="check" size={18} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-cmd-muted">
            {t("ob.details.growthStage")}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STAGE_OPTIONS.map((opt) => {
              const isSel = stage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStage(opt.value)}
                  aria-pressed={isSel}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    isSel
                      ? "border-teal bg-cmd-tile"
                      : "border-black/10 dark:border-white/10 bg-cmd-surface hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold text-cmd-heading">
                    {t(opt.labelKey)}
                  </span>
                  {opt.value === "harvest" ? (
                    <span className="mt-1 inline-block rounded bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                      {t("ob.details.harvestPriority")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block rounded-xl bg-cmd-surface p-4 text-sm font-medium text-cmd-heading">
            {t("ob.details.householdSize")}
            <input
              type="number"
              min={1}
              max={30}
              value={householdSize}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  resident: {
                    householdSize: Number(e.target.value) || 1,
                    hasVulnerableMembers: hasVulnerable,
                  },
                }))
              }
              className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-cmd-tile px-3 py-2.5 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl bg-cmd-surface p-4">
            <input
              type="checkbox"
              checked={hasVulnerable}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  resident: {
                    householdSize,
                    hasVulnerableMembers: e.target.checked,
                  },
                }))
              }
              className="size-4 accent-teal"
            />
            <span className="text-sm text-cmd-heading">
              {t("ob.details.hasVulnerable")}
            </span>
          </label>
        </div>
      )}

      {/* SMS offline broadcast (uses the verified number) */}
      <div className="mt-4 rounded-xl border border-teal/30 bg-cmd-surface p-4">
        <div className="flex items-center gap-2">
          <span className="text-teal">
            <Icon name="radio" size={18} />
          </span>
          <h3 className="text-sm font-semibold text-cmd-heading">
            {t("ob.details.smsBroadcast")}
          </h3>
          <span className="rounded bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal">
            {t("ob.details.smsFree")}
          </span>
        </div>
        <p className="mt-2 text-xs text-cmd-muted">{t("ob.details.smsDesc")}</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-cmd-tile px-3 py-2.5">
          <Icon name="phone" size={14} />
          <span className="text-sm font-medium text-cmd-heading">
            {smsNumber ? formatPhMobile(smsNumber) : "+63 ••• ••• ••••"}
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-teal">
            <Icon name="check" size={12} />
            {t("ob.details.smsVerified")}
          </span>
        </div>
        <p className="mt-2 text-[10px] text-cmd-muted">
          {t("ob.details.dataPrivacy")}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-cmd-muted hover:text-cmd-heading"
        >
          <Icon name="arrow-left" size={16} />
          {t("ob.back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          {t("ob.details.continue")}
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </section>
  );
}

// --- Step 4: Permissions ---

interface IPermissionsStepProps {
  draft: IOnboardingState;
  setDraft: React.Dispatch<React.SetStateAction<IOnboardingState>>;
  name: string;
  mobile?: string;
  saving: boolean;
  saveError: string | null;
  onBack: () => void;
  onFinish: () => void;
}

function PermissionsStep({
  draft,
  setDraft,
  name,
  mobile,
  saving,
  saveError,
  onBack,
  onFinish,
}: IPermissionsStepProps) {
  const { t } = useLanguage();
  const p = draft.permissions;

  function toggle(key: keyof typeof p) {
    setDraft((d) => ({
      ...d,
      permissions: { ...d.permissions, [key]: !d.permissions[key] },
    }));
  }

  const perms: {
    key: keyof typeof p;
    icon: IconName;
    titleKey: ITranslationKey;
    tagKey: ITranslationKey;
    descKey: ITranslationKey;
    tagTone: string;
  }[] = [
    {
      key: "emergencyAlerts",
      icon: "alert-triangle",
      titleKey: "ob.perm.emergencyAlerts",
      tagKey: "ob.perm.emergencyTag",
      descKey: "ob.perm.emergencyDesc",
      tagTone: "bg-alert text-white",
    },
    {
      key: "smsFallback",
      icon: "radio",
      titleKey: "ob.perm.smsFallback",
      tagKey: "ob.perm.smsFallbackTag",
      descKey: "ob.perm.smsFallbackDesc",
      tagTone: "bg-teal/15 text-teal",
    },
    {
      key: "evacuationGuidance",
      icon: "location",
      titleKey: "ob.perm.evacGuidance",
      tagKey: "ob.perm.evacTag",
      descKey: "ob.perm.evacDesc",
      tagTone: "bg-teal/15 text-teal",
    },
  ];

  const roleLabelKey: ITranslationKey =
    draft.role === "farmer"
      ? "ob.role.farmer"
      : draft.role === "barangay"
        ? "ob.role.barangay"
        : draft.role === "lgu"
          ? "ob.role.lgu"
          : "ob.role.resident";

  const isFarmerSummary = draft.role === "farmer" && Boolean(draft.farmer);
  const cropLabelKey: ITranslationKey =
    draft.farmer?.crop === "corn"
      ? "ob.details.cropCorn"
      : draft.farmer?.crop === "vegetable"
        ? "ob.details.cropVegetable"
        : draft.farmer?.crop === "aquaculture"
          ? "ob.details.cropAqua"
          : "ob.details.cropRice";

  return (
    <section>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-teal">
        <Icon name="check" size={14} />
        {t("ob.perm.badge")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-cmd-heading sm:text-3xl">
        {t("ob.perm.titlePrefix")}{" "}
        <span className="text-teal">{t("ob.perm.titleHighlight")}</span>
        {t("ob.perm.titleReady")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-cmd-muted">
        {t("ob.perm.subtitle")}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Registration summary */}
        <div className="rounded-xl bg-cmd-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cmd-heading">
              {t("ob.perm.summaryTitle")}
            </h2>
            <span className="rounded bg-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase text-teal">
              {t("ob.perm.summaryActive")}
            </span>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3">
              <span className="text-teal">
                <Icon name="users" size={16} />
              </span>
              <div>
                <dt className="text-xs text-cmd-muted">{t("ob.perm.sector")}</dt>
                <dd className="font-medium text-cmd-heading">
                  {name ? `${name} · ` : ""}
                  {t(roleLabelKey)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3">
              <span className="text-teal">
                <Icon name="location" size={16} />
              </span>
              <div>
                <dt className="text-xs text-cmd-muted">
                  {t("ob.perm.location")}
                </dt>
                <dd className="font-medium text-cmd-heading">
                  Brgy. {draft.location.barangay}, {draft.location.municipality}
                  , {draft.location.province}
                </dd>
              </div>
            </div>
            {mobile ? (
              <div className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3">
                <span className="text-teal">
                  <Icon name="phone" size={16} />
                </span>
                <div>
                  <dt className="text-xs text-cmd-muted">
                    {t("ob.perm.mobile")}
                  </dt>
                  <dd className="font-medium text-cmd-heading">
                    {formatPhMobile(mobile)}
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-teal">
                      <Icon name="check" size={11} />
                      {t("ob.details.smsVerified")}
                    </span>
                  </dd>
                </div>
              </div>
            ) : null}
            {isFarmerSummary ? (
              <div className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3">
                <span className="text-teal">
                  <Icon name="sprout" size={16} />
                </span>
                <div>
                  <dt className="text-xs text-cmd-muted">
                    {t("ob.details.mainCrop")}
                  </dt>
                  <dd className="font-medium text-cmd-heading">
                    {t(cropLabelKey)}
                  </dd>
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3">
              <span className="text-teal">
                <Icon name="cloud" size={16} />
              </span>
              <div>
                <dt className="text-xs text-cmd-muted">
                  {t("ob.perm.weatherFeed")}
                </dt>
                <dd className="font-medium text-cmd-heading">
                  PAGASA Synoptic · {draft.location.municipality}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Permission toggles */}
        <div className="rounded-xl bg-cmd-surface p-5">
          <h2 className="text-sm font-semibold text-cmd-heading">
            {t("ob.perm.critical")}
          </h2>
          <p className="mt-0.5 text-xs text-cmd-muted">
            {t("ob.perm.permSubtitle")}
          </p>
          <ul className="mt-4 space-y-3">
            {perms.map((perm) => (
              <li
                key={perm.key}
                className="flex items-start gap-3 rounded-lg bg-cmd-tile p-3"
              >
                <span className="mt-0.5 text-teal">
                  <Icon name={perm.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-cmd-heading">
                      {t(perm.titleKey)}
                    </p>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${perm.tagTone}`}
                    >
                      {t(perm.tagKey)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cmd-muted">
                    {t(perm.descKey)}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p[perm.key]}
                  aria-label={t(perm.titleKey)}
                  onClick={() => toggle(perm.key)}
                  className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    p[perm.key] ? "bg-teal" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white transition-transform ${
                      p[perm.key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] text-cmd-muted">
            <Icon name="lock" size={12} />
            {t("ob.perm.localNote")}
          </p>
        </div>
      </div>

      {saveError ? (
        <p className="mt-4 text-sm text-alert" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-cmd-muted hover:text-cmd-heading disabled:opacity-50"
        >
          <Icon name="arrow-left" size={16} />
          {t("ob.back")}
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          {saving ? t("ob.perm.saving") : t("ob.perm.enter")}
          {!saving ? <Icon name="arrow-right" size={16} /> : null}
        </button>
      </div>
    </section>
  );
}
