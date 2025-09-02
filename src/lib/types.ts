

export type User = {
  id: string;
  fullName: string;
  company: string;
  appRole: 'Crew Member' | 'Crew Supervisor' | 'Admin' | 'Subcontractor Admin' | 'MEI Supervisor' | 'Read Only';
  DAMid: number;
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
  isActive: boolean;
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

export type TimesheetStatus = 'Submitted' | 'Approved' | 'Rejected' | 'For Payment' | 'Paid';

// New data model for individual timesheets
export type Timesheet = {
  id: string;
  crewDocketId: string;
  crewMemberId: string;
  company: string;
  submittedById: string;
  productiveHours: number;
  unproductiveEntries: UnproductiveEntry[];
  status: TimesheetStatus;
  shiftStart: Date;
  shiftEnd: Date;
};

export type CrewDocketStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Processed';

// New data model for crew-level work dockets
export type CrewDocket = {
  id: string;
  timesheetDate: Date;
  company: string;
  zone: string;
  section: string;
  asset: string;
  subAsset: string;
  activityId: string;
  quantity: number;
  notes?: string;
  submittedAt: Date;
  submittedById: string;
  crewMemberIds: string[];
  status: CrewDocketStatus;
};

// Enriched type for displaying data in the UI
export type TimesheetWithDetails = Timesheet & {
  crewDocket: CrewDocket;
  crewMember: User | null;
  submittedBy: User | null;
};

export type CrewDocketWithDetails = CrewDocket & {
  timesheets: Timesheet[];
  activity: Activity | null;
  submittedBy: User | null;
  crewMembers: User[];
};

export type Location = {
  id: string;
  zone: string;
  section: string;
  isActive: boolean;
}
