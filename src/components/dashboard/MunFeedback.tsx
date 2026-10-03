"use client";

import { useLanguage } from "@/components/common";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";

export interface IMunFeedbackProps {
  /** Last action result; nothing renders when null. */
  result: IMunStoreResult | null;
  /** Override the success text. */
  successText?: string;
}

/** Inline success / Filipino error line for a store action. */
export default function MunFeedback({ result, successText }: IMunFeedbackProps) {
  const { t } = useLanguage();
  if (!result) {
    return null;
  }
  if (result.ok) {
    return (
      <p className="mt-2 text-xs font-semibold text-teal" role="status">
        {successText ?? t("mun.status.ok")}
      </p>
    );
  }
  return (
    <p className="mt-2 text-xs font-semibold text-alert" role="alert">
      {t(result.errorKey, result.vars)}
    </p>
  );
}
