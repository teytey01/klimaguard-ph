// shared types

export interface IHazardAlert {
  signalLevel: 1 | 2 | 3 | 4 | 5;
  typhoonName: string;
  affectedAreas: string[];
  timestamp: string;
  severity: "advisory" | "warning" | "emergency";
}

export interface IEvacuationCenter {
  name: string;
  distance: string;
  capacity: string;
  directionsUrl: string;
}

export interface IHotline {
  label: string;
  number: string;
  tel: string;
}

export interface IAlertState {
  hasActiveHazard: boolean;
  alert: IHazardAlert | null;
  evacuationCenters: IEvacuationCenter[];
  hotlines: IHotline[];
  source: string;
  fetchedAt: string;
}
