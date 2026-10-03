"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/components/common/AuthProvider";
import type { IMunicipalState } from "@/types";
import * as store from "./municipalStore";

type IDropFirst<T> = T extends (actor: string, ...rest: infer R) => infer Ret ? (...args: R) => Ret : never;

export interface IMunicipalActions {
  updateEvacOccupancy: IDropFirst<typeof store.updateEvacOccupancy>;
  setEvacStatus: IDropFirst<typeof store.setEvacStatus>;
  reviewDana: IDropFirst<typeof store.reviewDana>;
  setProjectProgress: IDropFirst<typeof store.setProjectProgress>;
  respondReport: IDropFirst<typeof store.respondReport>;
  submitReport: IDropFirst<typeof store.submitReport>;
  upsertBudgetLine: IDropFirst<typeof store.upsertBudgetLine>;
  importBudgetCsv: IDropFirst<typeof store.importBudgetCsv>;
  tagCcet: IDropFirst<typeof store.tagCcet>;
  toggleChecklist: IDropFirst<typeof store.toggleChecklist>;
  triggerChecklist: IDropFirst<typeof store.triggerChecklist>;
  ackChecklist: IDropFirst<typeof store.ackChecklist>;
  dispatchRelief: IDropFirst<typeof store.dispatchRelief>;
  allocateRcef: IDropFirst<typeof store.allocateRcef>;
  broadcastSitrep: IDropFirst<typeof store.broadcastSitrep>;
  sendBdrrmcDirective: IDropFirst<typeof store.sendBdrrmcDirective>;
  broadcastResidentAlert: IDropFirst<typeof store.broadcastResidentAlert>;
  sendDanaForms: IDropFirst<typeof store.sendDanaForms>;
  setLccapProgress: IDropFirst<typeof store.setLccapProgress>;
  toggleCdraStep: IDropFirst<typeof store.toggleCdraStep>;
  toggleClupClimate: IDropFirst<typeof store.toggleClupClimate>;
  setEmergency: IDropFirst<typeof store.setEmergency>;
  resetMunicipalState: IDropFirst<typeof store.resetMunicipalState>;
}

export interface IUseMunicipalStoreResult {
  state: IMunicipalState;
  actions: IMunicipalActions;
  /** Audit actor label, e.g. "Engr. Maria Santos (MDRRMO)". */
  actor: string;
}

/**
 * Municipal store + actions bound to the signed-in official (audit WHO).
 */
export function useMunicipalStore(): IUseMunicipalStoreResult {
  const { session } = useAuth();
  const state = useSyncExternalStore(
    store.subscribeMunicipal,
    store.getMunicipalSnapshot,
    store.getMunicipalServerSnapshot,
  );
  const actor = `${session?.name ?? "Municipal Official"} (MDRRMO)`;

  const actions = useMemo<IMunicipalActions>(
    () => ({
      updateEvacOccupancy: (...a) => store.updateEvacOccupancy(actor, ...a),
      setEvacStatus: (...a) => store.setEvacStatus(actor, ...a),
      reviewDana: (...a) => store.reviewDana(actor, ...a),
      setProjectProgress: (...a) => store.setProjectProgress(actor, ...a),
      respondReport: (...a) => store.respondReport(actor, ...a),
      submitReport: (...a) => store.submitReport(actor, ...a),
      upsertBudgetLine: (...a) => store.upsertBudgetLine(actor, ...a),
      importBudgetCsv: (...a) => store.importBudgetCsv(actor, ...a),
      tagCcet: (...a) => store.tagCcet(actor, ...a),
      toggleChecklist: (...a) => store.toggleChecklist(actor, ...a),
      triggerChecklist: () => store.triggerChecklist(actor),
      ackChecklist: (...a) => store.ackChecklist(actor, ...a),
      dispatchRelief: (...a) => store.dispatchRelief(actor, ...a),
      allocateRcef: (...a) => store.allocateRcef(actor, ...a),
      broadcastSitrep: () => store.broadcastSitrep(actor),
      sendBdrrmcDirective: (...a) => store.sendBdrrmcDirective(actor, ...a),
      broadcastResidentAlert: (...a) => store.broadcastResidentAlert(actor, ...a),
      sendDanaForms: () => store.sendDanaForms(actor),
      setLccapProgress: (...a) => store.setLccapProgress(actor, ...a),
      toggleCdraStep: (...a) => store.toggleCdraStep(actor, ...a),
      toggleClupClimate: (...a) => store.toggleClupClimate(actor, ...a),
      setEmergency: (...a) => store.setEmergency(actor, ...a),
      resetMunicipalState: () => store.resetMunicipalState(actor),
    }),
    [actor],
  );

  return { state, actions, actor };
}
