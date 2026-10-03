"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader, HotlineFooter, Icon, useAuth, useLanguage } from "@/components/common";
import { formatPhMobile, normalizePhMobile, sendOtp } from "@/lib/sms";
import type { IAuthSession } from "@/types";

type Mode = "resident" | "official";
type Phase = "collect" | "verify";

const RESEND_SECONDS = 30;

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-cmd-tile px-3 py-2.5 text-sm text-cmd-heading placeholder:text-cmd-muted/70 focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal";
const PRIMARY_BUTTON =
  "mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-cmd-surface";

/** POST JSON and return `{ ok, data }`; network failures resolve, never throw. */
async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | (T & { error?: string })
      | null;
    return { ok: res.ok, data, error: res.ok ? null : (data?.error ?? null) };
  } catch {
    return { ok: false, data: null, error: null };
  }
}

/** Where a freshly signed-in user should land. */
function landingFor(session: IAuthSession): string {
  return session.onboarded ? "/dashboard" : "/onboarding";
}

/**
 * Sign-in. Residents: name + PH mobile → simulated OTP (demo 123456) verified
 * server-side, which creates a DB-backed cookie session. Officials: the
 * pre-created username + password accounts from the docs (no self sign-up).
 */
export default function SignInPage() {
  const { t } = useLanguage();
  const { session, signIn, ready } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("resident");
  const [phase, setPhase] = useState<Phase>("collect");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [normalized, setNormalized] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Already signed in → skip ahead.
  useEffect(() => {
    if (ready && session?.verified) {
      router.replace(landingFor(session));
    }
  }, [ready, session, router]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPhase("collect");
  }

  async function requestCode(norm: string): Promise<boolean> {
    const result = await postJson<{ sent: boolean }>("/api/auth/otp", { mobile: norm });
    if (!result.ok) {
      setError(result.error ?? t("signin.errorNetwork"));
      return false;
    }
    // Mirror the simulated SMS into the on-screen broadcast log.
    sendOtp(norm);
    return true;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError(t("signin.errorName"));
      return;
    }
    const norm = normalizePhMobile(mobile);
    if (!norm) {
      setError(t("signin.errorMobile"));
      return;
    }
    setBusy(true);
    const sent = await requestCode(norm);
    setBusy(false);
    if (sent) {
      setNormalized(norm);
      setCode("");
      setPhase("verify");
      setResendIn(RESEND_SECONDS);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || !normalized) {
      return;
    }
    setError(null);
    if (await requestCode(normalized)) {
      setResendIn(RESEND_SECONDS);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await postJson<{ session: IAuthSession }>("/api/auth/verify", {
      mobile: normalized,
      code,
      name: name.trim(),
    });
    setBusy(false);
    if (!result.ok || !result.data?.session) {
      setError(result.error ?? t("signin.errorNetwork"));
      return;
    }
    signIn(result.data.session);
    router.replace(landingFor(result.data.session));
  }

  async function handleOfficialLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await postJson<{ session: IAuthSession }>("/api/auth/login", {
      username: username.trim(),
      password,
    });
    setBusy(false);
    if (!result.ok || !result.data?.session) {
      setError(result.error ?? t("signin.errorNetwork"));
      return;
    }
    signIn(result.data.session);
    router.replace("/dashboard");
  }

  const errorBlock = error ? (
    <p className="mt-3 text-sm text-alert" role="alert">
      {error}
    </p>
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-cmd-surface p-6 shadow-md dark:border-white/10 sm:p-8">
          <div className="flex items-center gap-2 text-teal">
            <Icon name="shield" size={22} />
            <span className="text-xs font-bold uppercase tracking-wide">
              KlimaGuard <span className="text-teal">PH</span>
            </span>
          </div>

          {/* Resident / Official switch */}
          <div
            role="tablist"
            aria-label={`${t("signin.residentTab")} / ${t("signin.officialTab")}`}
            className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-cmd-tile p-1"
          >
            {(["resident", "official"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`min-h-[40px] rounded-md text-sm font-semibold transition-colors ${
                  mode === m ? "bg-teal text-white" : "text-cmd-muted hover:text-cmd-heading"
                }`}
              >
                {m === "resident" ? t("signin.residentTab") : t("signin.officialTab")}
              </button>
            ))}
          </div>

          {mode === "official" ? (
            <form onSubmit={handleOfficialLogin} className="mt-5" noValidate>
              <h1 className="text-xl font-semibold text-cmd-heading">
                {t("signin.officialTitle")}
              </h1>
              <p className="mt-2 text-sm text-cmd-muted">{t("signin.officialSubtitle")}</p>

              <label className="mt-5 block text-sm font-medium text-cmd-heading">
                {t("signin.usernameLabel")}
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  className={INPUT_CLASS}
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-cmd-heading">
                {t("signin.passwordLabel")}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={INPUT_CLASS}
                />
              </label>
              <p className="mt-2 text-xs font-medium text-cmd-accent">
                {t("signin.officialDemo")}
              </p>

              {errorBlock}

              <button
                type="submit"
                disabled={busy || !username || !password}
                className={PRIMARY_BUTTON}
              >
                {busy ? t("signin.loggingIn") : t("signin.login")}
                {!busy ? <Icon name="arrow-right" size={16} /> : null}
              </button>
            </form>
          ) : phase === "collect" ? (
            <form onSubmit={handleSend} className="mt-5" noValidate>
              <h1 className="text-xl font-semibold text-cmd-heading">
                {t("signin.title")}
              </h1>
              <p className="mt-2 text-sm text-cmd-muted">{t("signin.subtitle")}</p>

              <label className="mt-5 block text-sm font-medium text-cmd-heading">
                {t("signin.nameLabel")}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("signin.namePlaceholder")}
                  autoComplete="name"
                  className={INPUT_CLASS}
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-cmd-heading">
                {t("signin.mobileLabel")}
                <div className="mt-1 flex items-center rounded-lg border border-black/10 dark:border-white/15 bg-cmd-tile focus-within:border-teal focus-within:ring-2 focus-within:ring-teal">
                  <span className="flex items-center gap-1.5 border-r border-black/10 dark:border-white/15 px-3 py-2.5 text-sm text-cmd-muted">
                    <Icon name="phone" size={14} />
                    +63
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder={t("signin.mobilePlaceholder")}
                    autoComplete="tel-national"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-cmd-heading placeholder:text-cmd-muted/70 focus:outline-none"
                  />
                </div>
              </label>

              {errorBlock}

              <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
                {busy ? t("signin.sending") : t("signin.sendCode")}
                {!busy ? <Icon name="arrow-right" size={16} /> : null}
              </button>

              <p className="mt-4 flex items-start gap-1.5 text-xs text-cmd-muted">
                <span className="mt-0.5 text-teal">
                  <Icon name="lock" size={13} />
                </span>
                {t("signin.privacy")}
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-5" noValidate>
              <h1 className="text-xl font-semibold text-cmd-heading">
                {t("signin.otpTitle")}
              </h1>
              <p className="mt-2 text-sm text-cmd-muted">
                {t("signin.otpSubtitle", {
                  number: normalized ? formatPhMobile(normalized) : "",
                })}
              </p>
              <p className="mt-1 text-xs font-medium text-cmd-accent">
                {t("signin.otpDemoNote")}
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                aria-label={t("signin.otpTitle")}
                autoComplete="one-time-code"
                className="mt-5 w-full rounded-lg border border-black/10 dark:border-white/15 bg-cmd-tile px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                placeholder="______"
              />

              {errorBlock}

              <button
                type="submit"
                disabled={busy || code.length < 6}
                className={PRIMARY_BUTTON}
              >
                {busy ? t("signin.verifying") : t("signin.verify")}
              </button>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("collect");
                    setCode("");
                    setError(null);
                  }}
                  className="text-cmd-muted hover:text-cmd-heading"
                >
                  {t("signin.changeNumber")}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0}
                  className="text-teal disabled:text-cmd-muted"
                >
                  {resendIn > 0
                    ? t("signin.resendIn", { seconds: resendIn })
                    : t("signin.resend")}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <HotlineFooter />
    </div>
  );
}
