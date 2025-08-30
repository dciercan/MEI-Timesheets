import type { User, Activity, UnproductiveReason, TimesheetSubmission } from './types';

export const users: User[] = [
  { id: '1', fullName: 'John Doe', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '2', fullName: 'Jane Smith', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '3', fullName: 'Mike Johnson', company: 'BuildIt', appRole: 'Crew Member' },
  { id: '4', fullName: 'Emily White', company: 'BuildIt', appRole: 'Crew Supervisor' },
  { id: '5', fullName: 'Chris Green', company: 'Spark', appRole: 'Timesheet Admin' },
  { id: '6', fullName: 'Sarah Brown', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '7', fullName: 'David Wilson', company: 'ConstructCo', appRole: 'Crew Supervisor' },
  { id: '8', fullName: 'Jessica Garcia', company: 'BuildIt', appRole: 'Crew Member' },
  { id: '9', fullName: 'Daniel Miller', company: 'BuildIt', appRole: 'Crew Member' },
  { id: '10', fullName: 'Linda Martinez', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '11', fullName: 'Robert Anderson', company: 'ConstructCo', appRole: 'Crew Member' },
  { id: '12', fullName: 'Patricia Thomas', company: 'BuildIt', appRole: 'Crew Member' },
  { id: '13', fullName: 'James Jackson', company: 'BuildIt', appRole: 'Crew Supervisor' },
  { id: '14', fullName: 'Susan Clark', company: 'Spark', appRole: 'Timesheet Admin' },
  { id: '15', fullName: 'Paul Walker', company: 'ConstructCo', appRole: 'Crew Supervisor' },
];

export const activities: Activity[] = [
  // Asset: Non-Cable Items
  // Asset: Signs
  { id: 'act-nc-01', contract: 'C-456', zone: 'S1', section: 'M011', asset: 'Signs', subAsset: 'Variable Message Sign', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-101' },
  { id: 'act-nc-02', contract: 'C-456', zone: 'S1', section: 'M011', asset: 'Signs', subAsset: 'Variable Message Sign', activity: 'Unit Anchor Survey', activityUom: 'Each', wbsCode: 'WBS-NC-102' },
  { id: 'act-nc-03', contract: 'C-456', zone: 'S1', section: 'M011', asset: 'Signs', subAsset: 'Variable Message Sign', activity: 'Unit Anchor Install', activityUom: 'Each', wbsCode: 'WBS-NC-103' },
  { id: 'act-nc-04', contract: 'C-456', zone: 'S1', section: 'M011', asset: 'Signs', subAsset: 'Variable Message Sign', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-104' },
  { id: 'act-nc-05', contract: 'C-456', zone: 'S2', section: 'M01J', asset: 'Signs', subAsset: 'Lane Usage Sign', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-101' },
  { id: 'act-nc-06', contract: 'C-456', zone: 'S2', section: 'M01J', asset: 'Signs', subAsset: 'Lane Usage Sign', activity: 'Unit Anchor Survey', activityUom: 'Each', wbsCode: 'WBS-NC-102' },
  { id: 'act-nc-07', contract: 'C-456', zone: 'S2', section: 'M01J', asset: 'Signs', subAsset: 'Lane Usage Sign', activity: 'Unit Anchor Install', activityUom: 'Each', wbsCode: 'WBS-NC-103' },
  { id: 'act-nc-08', contract: 'C-456', zone: 'S2', section: 'M01J', asset: 'Signs', subAsset: 'Lane Usage Sign', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-104' },
  
  // Asset: Cameras
  { id: 'act-nc-09', contract: 'C-456', zone: 'S3', section: 'M020 S1', asset: 'Cameras', subAsset: 'CCTV Camera', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-201' },
  { id: 'act-nc-10', contract: 'C-456', zone: 'S3', section: 'M020 S1', asset: 'Cameras', subAsset: 'CCTV Camera', activity: 'Unit Anchor Survey', activityUom: 'Each', wbsCode: 'WBS-NC-202' },
  { id: 'act-nc-11', contract: 'C-456', zone: 'S3', section: 'M020 S1', asset: 'Cameras', subAsset: 'CCTV Camera', activity: 'Unit Anchor Install', activityUom: 'Each', wbsCode: 'WBS-NC-203' },
  { id: 'act-nc-12', contract: 'C-456', zone: 'S3', section: 'M020 S1', asset: 'Cameras', subAsset: 'CCTV Camera', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-204' },

  // Asset: Sensors
  { id: 'act-nc-13', contract: 'C-456', zone: 'S4', section: 'Central Corridor', asset: 'Sensors', subAsset: 'Traffic Sensor', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-301' },
  { id: 'act-nc-14', contract: 'C-456', zone: 'S4', section: 'Central Corridor', asset: 'Sensors', subAsset: 'Traffic Sensor', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-304' },
  
  // Asset: Lights
  { id: 'act-nc-15', contract: 'C-456', zone: 'S5', section: 'XP1', asset: 'Lights', subAsset: 'Tunnel Lighting', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-401' },
  { id: 'act-nc-16', contract: 'C-456', zone: 'S5', section: 'XP1', asset: 'Lights', subAsset: 'Tunnel Lighting', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-404' },

  // Asset: Switches
  { id: 'act-nc-17', contract: 'C-456', zone: 'MAN RAMPS', section: 'XP2', asset: 'Switches', subAsset: 'Network Switch', activity: 'Unit Install', activityUom: 'Each', wbsCode: 'WBS-NC-501' },
  { id: 'act-nc-18', contract: 'C-456', zone: 'MAN RAMPS', section: 'XP2', asset: 'Switches', subAsset: 'Network Switch', activity: 'Unit Test', activityUom: 'Each', wbsCode: 'WBS-NC-504' },
  
  // Asset: Cable Items
  // Asset: Cables
  { id: 'act-c-01', contract: 'C-456', zone: 'LPR RAMPS', section: 'XP3', asset: 'Cables', subAsset: 'Fiber Optic Cable', activity: 'Cable Install', activityUom: 'm', wbsCode: 'WBS-C-101' },
  { id: 'act-c-02', contract: 'C-456', zone: 'LPR RAMPS', section: 'XP3', asset: 'Cables', subAsset: 'Fiber Optic Cable', activity: 'Cable Termination', activityUom: 'Core', wbsCode: 'WBS-C-102' },
  { id: 'act-c-03', contract: 'C-456', zone: 'LPR RAMPS', section: 'XP3', asset: 'Cables', subAsset: 'Fiber Optic Cable', activity: 'Cable Test', activityUom: 'Core', wbsCode: 'WBS-C-103' },
  { id: 'act-c-04', contract: 'C-456', zone: 'S1', section: 'XP4', asset: 'Cables', subAsset: 'Power Cable LV', activity: 'Cable Install', activityUom: 'm', wbsCode: 'WBS-C-101' },
  { id: 'act-c-05', contract: 'C-456', zone: 'S1', section: 'XP4', asset: 'Cables', subAsset: 'Power Cable LV', activity: 'Cable Termination', activityUom: 'End', wbsCode: 'WBS-C-102' },
  { id: 'act-c-06', contract: 'C-456', zone: 'S1', section: 'XP4', asset: 'Cables', subAsset: 'Power Cable LV', activity: 'Cable Test', activityUom: 'Circuit', wbsCode: 'WBS-C-103' },

  // Asset: Cable Containment
  { id: 'act-c-07', contract: 'C-456', zone: 'S2', section: 'XP5', asset: 'Cable Containment', subAsset: 'Cable Ladder', activity: 'Unit Install', activityUom: 'm', wbsCode: 'WBS-NC-601' },
  { id: 'act-c-08', contract: 'C-456', zone: 'S2', section: 'XP5', asset: 'Cable Containment', subAsset: 'Conduit', activity: 'Unit Install', activityUom: 'm', wbsCode: 'WBS-NC-601' },

];

export const unproductiveReasons: UnproductiveReason[] = [
  { id: 'unprod-01', code: 'SAF', reason: 'Safety Meeting', uom: 'min' },
  { id: 'unprod-02', code: 'PRE', reason: 'Prestarts', uom: 'min' },
  { id: 'unprod-03', code: 'CRB', reason: 'Crib', uom: 'min' },
  { id: 'unprod-04', code: 'LOG', reason: 'Logistics - Transit Travel', uom: 'min' },
  { id: 'unprod-05', code: 'TOB', reason: 'Toilet Breaks', uom: 'min' },
];

export const timesheetSubmissions: TimesheetSubmission[] = [
    {
        id: 'ts-001',
        timesheetDate: new Date('2024-07-22T00:00:00.000Z'),
        crewMemberId: '1',
        zone: 'S1',
        section: 'M011',
        asset: 'Signs',
        subAsset: 'Variable Message Sign',
        activityId: 'act-nc-01',
        productiveHours: 6,
        quantity: 1,
        unproductiveEntries: [
            { reasonId: 'unprod-01', hours: 1 },
        ],
        notes: 'Installed one VMS unit on gantry 5. Heavy rain in the afternoon.',
        submittedAt: new Date('2024-07-22T17:00:00.000Z'),
    },
    {
        id: 'ts-002',
        timesheetDate: new Date('2024-07-21T00:00:00.000Z'),
        crewMemberId: '2',
        zone: 'LPR RAMPS',
        section: 'XP3',
        asset: 'Cables',
        subAsset: 'Fiber Optic Cable',
        activityId: 'act-c-02',
        productiveHours: 8,
        quantity: 12,
        unproductiveEntries: [],
        notes: 'Terminated 12 fiber cores in comms room 3.',
        submittedAt: new Date('2024-07-21T18:00:00.000Z'),
    }
];
