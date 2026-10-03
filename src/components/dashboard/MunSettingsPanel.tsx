"use client";

import { useState } from "react";
import { Icon, LanguageToggle, ThemeToggle, useAuth, useLanguage } from "@/components/common";
import { useMunicipalLogout } from "@/lib/dashboard/useMunicipalLogout";
import { MUN_BTN_ALERT, MUN_BTN_OUTLINE } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import MunSection from "./MunSection";

export type IMunSettingsPanelProps = Record<string, never>;

/** Settings: profile, theme + language, demo reset (confirm), and log out. */
export default function MunSettingsPanel() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { actions } = useMunicipalStore();
  const logout = useMunicipalLogout();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <MunSection title={t("mun.sec.profile")} icon="users">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-cmd-muted">{t("mun.f.name")}</dt>
          <dd className="text-cmd-heading">{session?.name ?? "—"}</dd>
          <dt className="text-cmd-muted">{t("mun.f.role")}</dt>
          <dd className="text-cmd-heading">{t("res.roleMunicipal")}</dd>
          <dt className="text-cmd-muted">{t("mun.f.department")}</dt>
          <dd className="text-cmd-heading">{session?.department ?? "MDRRMO"}</dd>
          <dt className="text-cmd-muted">{t("mun.f.municipality")}</dt>
          <dd className="text-cmd-heading">Calamba, Laguna</dd>
        </dl>
      </MunSection>

      <MunSection title={t("mun.sec.preferences")} icon="sun">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-cmd-muted">{t("mun.f.theme")}</span>
          <ThemeToggle />
          <span className="text-sm text-cmd-muted">{t("mun.f.language")}</span>
          <LanguageToggle />
        </div>
      </MunSection>

      <MunSection title={t("mun.sec.data")} icon="scroll">
        {confirming ? (
          <div>
            <p className="text-sm text-cmd-heading">{t("mun.misc.resetConfirm")}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  actions.resetMunicipalState();
                  setConfirming(false);
                  setDone(true);
                }}
                className={MUN_BTN_ALERT}
              >
                {t("mun.action.confirmReset")}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={MUN_BTN_OUTLINE}>
                {t("mun.action.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setConfirming(true);
            }}
            className={MUN_BTN_OUTLINE}
          >
            {t("mun.action.reset")}
          </button>
        )}
        {done ? (
          <p className="mt-2 text-xs font-semibold text-teal" role="status">
            {t("mun.misc.resetDone")}
          </p>
        ) : null}
      </MunSection>

      <MunSection title={t("mun.sec.account")} icon="lock">
        <button type="button" onClick={() => void logout()} className={MUN_BTN_ALERT}>
          <Icon name="log-out" size={16} />
          {t("mun.side.logout")}
        </button>
      </MunSection>
    </div>
  );
}
