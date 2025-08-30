export type User = {
  id: string;
  fullName: string;
  company: string;
  appRole: 'Crew Member' | 'Crew Supervisor' | 'Timesheet Admin';
};

export type Activity = {
  id: string;
  contract: string;
  zone: string;
  section: string;
  asset: string;
  subAsset: string;
  activity: string;
  activityUom: string;
  wbsCode: string;
};

export type UnproductiveReason = {
  id: string;
  code: string;
  reason: string;
  uom: string;
};

export type UnproductiveEntry = {
  reasonId: string;
  hours: number;
};

export type TimesheetSubmission = {
  id: string;
  timesheetDate: Date;
  crewMemberId: string;
  zone: string;
  section: string;
  asset: string;
  subAsset: string;
  activityId: string;
  productiveHours: number;
  quantity: number;
  unproductiveEntries: UnproductiveEntry[];
  notes?: string;
  submittedAt: Date;
};

    