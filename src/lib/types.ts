

export type User = {
  id: string;
  fullName: string;
  company: string;
  appRole: 'Crew Member' | 'Crew Supervisor' | 'Admin' | 'Subcontractor Admin' | 'MEI Supervisor';
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
  id:string;
  timesheetDate: Date;
  crewMemberId: string;
  zone?: string;
  section?: string;
  asset: string;
  subAsset: string;
  activityId: string;
  productiveHours: number;
  quantity: number;
  unproductiveEntries: UnproductiveEntry[];
  notes?: string;
  submittedAt: Date;
  submittedById: string;
};

export type TimesheetSubmissionWithDetails = TimesheetSubmission & {
  crewMember: User | null;
  activity: Activity | null;
  submittedBy: User | null;
};
