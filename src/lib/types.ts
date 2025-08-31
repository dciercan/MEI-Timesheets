

export type User = {
  id: string;
  fullName: string;
  company: string;
  appRole: 'Crew Member' | 'Crew Supervisor' | 'Admin' | 'Subcontractor Admin' | 'MEI Supervisor' | 'Read Only';
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
  minutes: number;
};

// New data model for individual timesheets
export type Timesheet = {
  id: string;
  crewDocketId: string;
  crewMemberId: string;
  productiveHours: number;
  unproductiveEntries: UnproductiveEntry[];
};

// New data model for crew-level work dockets
export type CrewDocket = {
  id: string;
  timesheetDate: Date;
  company: string;
  zone?: string;
  section?: string;
  asset: string;
  subAsset: string;
  activityId: string;
  quantity: number;
  notes?: string;
  submittedAt: Date;
  submittedById: string;
  crewMemberIds: string[];
};

// Enriched type for displaying data in the UI
export type TimesheetWithDetails = Timesheet & {
  crewDocket: CrewDocket;
  crewMember: User | null;
};

export type CrewDocketWithDetails = CrewDocket & {
  timesheets: Timesheet[];
  activity: Activity | null;
  submittedBy: User | null;
  crewMembers: User[];
};
