import type { User, Activity, UnproductiveReason, TimesheetSubmission } from './types';

export const users: User[] = [
  { id: '1', fullName: 'John Doe', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '2', fullName: 'Jane Smith', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '3', fullName: 'Mike Johnson', company: 'BuildIt', appRole: 'Crew Member' },
  { id: '4', fullName: 'Emily White', company: 'BuildIt', appRole: 'Crew Supervisor' },
  { id: '5', fullName: 'Chris Green', company: 'AdminCorp', appRole: 'Timesheet Admin' },
];

export const activities: Activity[] = [
  { id: 'act-001', contract: 'C-123', zone: 'North', section: 'A1', asset: 'Road', subAsset: 'Pavement', activity: 'Asphalt Patching', activityUom: 'm2', wbsCode: 'WBS-101' },
  { id: 'act-002', contract: 'C-123', zone: 'North', section: 'A1', asset: 'Road', subAsset: 'Signage', activity: 'Install Sign', activityUom: 'Each', wbsCode: 'WBS-102' },
  { id: 'act-003', contract: 'C-124', zone: 'South', section: 'B2', asset: 'Bridge', subAsset: 'Deck', activity: 'Concrete Repair', activityUom: 'm3', wbsCode: 'WBS-201' },
  { id: 'act-004', contract: 'C-124', zone: 'South', section: 'B2', asset: 'Bridge', subAsset: 'Guardrail', activity: 'Guardrail Installation', activityUom: 'm', wbsCode: 'WBS-202' },
  { id: 'act-005', contract: 'C-125', zone: 'East', section: 'C3', asset: 'Drainage', subAsset: 'Culvert', activity: 'Culvert Cleaning', activityUom: 'Each', wbsCode: 'WBS-301' },
];

export const unproductiveReasons: UnproductiveReason[] = [
  { id: 'unprod-01', code: 'WEATHER', reason: 'Inclement Weather', uom: 'Hours' },
  { id: 'unprod-02', code: 'EQUIP-DOWN', reason: 'Equipment Breakdown', uom: 'Hours' },
  { id: 'unprod-03', code: 'SITE-ISSUE', reason: 'Site Access Issue', uom: 'Hours' },
  { id: 'unprod-04', code: 'MEETING', reason: 'Safety Meeting / Toolbox Talk', uom: 'Hours' },
];

export const timesheetSubmissions: TimesheetSubmission[] = [
    {
        id: 'ts-001',
        timesheetDate: new Date('2024-07-22T00:00:00.000Z'),
        crewMemberId: '1',
        zone: 'North',
        section: 'A1',
        activityId: 'act-001',
        productiveHours: 6,
        quantity: 15,
        unproductiveEntries: [
            { reasonId: 'unprod-04', hours: 1 },
            { reasonId: 'unprod-01', hours: 1 },
        ],
        notes: 'Completed patching on Main St. Heavy rain in the afternoon.',
        submittedAt: new Date('2024-07-22T17:00:00.000Z'),
    },
    {
        id: 'ts-002',
        timesheetDate: new Date('2024-07-21T00:00:00.000Z'),
        crewMemberId: '2',
        zone: 'South',
        section: 'B2',
        activityId: 'act-003',
        productiveHours: 8,
        quantity: 2,
        unproductiveEntries: [],
        notes: 'Bridge deck repair near exit 45.',
        submittedAt: new Date('2024-07-21T18:00:00.000Z'),
    }
];
