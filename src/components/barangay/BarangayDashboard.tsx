"use client";

import BarangayOpsProvider from "./BarangayOpsProvider";
import BarangayWorkspace from "./BarangayWorkspace";

export interface IBarangayDashboardProps {
  /** The official's OWN barangay (from the server session). */
  barangay: string;
  municipality: string;
  province: string;
  /** Signed-in official's name (sidebar + audit WHO). */
  name?: string;
}

/**
 * Barangay Official dashboard (v6 matrix, Barangay column): the barangay
 * operations state provider wrapped around the workspace UI.
 */
export default function BarangayDashboard(props: IBarangayDashboardProps) {
  return (
    <BarangayOpsProvider barangay={props.barangay}>
      <BarangayWorkspace {...props} />
    </BarangayOpsProvider>
  );
}
