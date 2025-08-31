

'use server';

import { revalidatePath } from 'next/cache';
import type { User, Activity, UnproductiveReason, CrewDocket, Timesheet, CrewDocketWithDetails, TimesheetWithDetails, CrewDocketStatus, TimesheetStatus, Location } from './types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { listModels } from 'genkit';

// In a real app, you would use a proper database.
const crewDocketsDbPath = path.join(process.cwd(), 'src', 'lib', 'crew-dockets.json');
const timesheetsDbPath = path.join(process.cwd(), 'src', 'lib', 'timesheets.json');
const usersDbPath = path.join(process.cwd(), 'src', 'lib', 'users.json');
const activitiesDbPath = path.join(process.cwd(), 'src', 'lib', 'activities.json');
const unproductiveReasonsDbPath = path.join(process.cwd(), 'src', 'lib', 'unproductiveReasons.json');
const locationsDbPath = path.join(process.cwd(), 'src', 'lib', 'locations.json');


// Data Functions
async function readCrewDockets(): Promise<CrewDocket[]> {
    try {
        await fs.access(crewDocketsDbPath);
        const data = await fs.readFile(crewDocketsDbPath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data).map((d: any) => ({ ...d, timesheetDate: new Date(d.timesheetDate), submittedAt: new Date(d.submittedAt) }));
    } catch (error) {
        return [];
    }
}

async function writeCrewDockets(dockets: CrewDocket[]): Promise<void> {
    await fs.writeFile(crewDocketsDbPath, JSON.stringify(dockets, null, 2), 'utf-8');
}

async function readTimesheets(): Promise<Timesheet[]> {
    try {
        await fs.access(timesheetsDbPath);
        const data = await fs.readFile(timesheetsDbPath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeTimesheets(timesheets: Timesheet[]): Promise<void> {
    await fs.writeFile(timesheetsDbPath, JSON.stringify(timesheets, null, 2), 'utf-8');
}

async function readUsers(): Promise<User[]> {
     try {
        await fs.access(usersDbPath);
        const data = await fs.readFile(usersDbPath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeUsers(users: User[]): Promise<void> {
     await fs.writeFile(usersDbPath, JSON.stringify(users, null, 2), 'utf-8');
}

async function readActivities(): Promise<Activity[]> {
    const data = await fs.readFile(activitiesDbPath, 'utf-8');
    return JSON.parse(data);
}

async function writeActivities(activities: Activity[]): Promise<void> {
    await fs.writeFile(activitiesDbPath, JSON.stringify(activities, null, 2), 'utf-8');
}

async function readUnproductiveReasons(): Promise<UnproductiveReason[]> {
    const data = await fs.readFile(unproductiveReasonsDbPath, 'utf-8');
    return JSON.parse(data);
}

async function writeUnproductiveReasons(reasons: UnproductiveReason[]): Promise<void> {
    await fs.writeFile(unproductiveReasonsDbPath, JSON.stringify(reasons, null, 2), 'utf-8');
}

async function readLocations(): Promise<Location[]> {
    const data = await fs.readFile(locationsDbPath, 'utf-8');
    return JSON.parse(data);
}

async function writeLocations(locations: Location[]): Promise<void> {
    await fs.writeFile(locationsDbPath, JSON.stringify(locations, null, 2), 'utf-8');
}


export async function getActivities(): Promise<Activity[]> {
    return readActivities();
}

export async function getUnproductiveReasons(): Promise<UnproductiveReason[]> {
    return readUnproductiveReasons();
}

export async function getLocations(): Promise<Location[]> {
    return readLocations();
}

export async function getZones(): Promise<string[]> {
    const locations = await readLocations();
    return locations.map(l => l.zone).sort((a,b) => a.localeCompare(b));
}

export async function getSections(): Promise<string[]> {
    const locations = await readLocations();
    const allSections = new Set<string>();
    locations.forEach(l => {
        l.sections.forEach(s => allSections.add(s));
    });
    return Array.from(allSections).sort((a,b) => a.localeCompare(b));
}


// Schema for the main timesheet form
const addCrewDocketSchema = z.object({
    submittedById: z.string().min(1, "Supervisor is required."),
    timesheetDate: z.coerce.date(),
    crewMemberIds: z.array(z.string()), // Can be empty if supervisor is only crew member
    zone: z.string().min(1, "Zone is required."),
    section: z.string().min(1, "Section is required."),
    asset: z.string().min(1, "Please select an asset."),
    subAsset: z.string().min(1, "Please select a sub-asset."),
    activityId: z.string().min(1, "Please select an activity."),
    productiveHours: z.coerce.number().min(0, "Productive hours must be a positive number."),
    quantity: z.coerce.number().min(0, "Quantity is required."),
    unproductiveEntries: z.array(
      z.object({
        reasonId: z.string().min(1, "Please select a reason."),
        minutes: z.coerce.number().min(1, "Minutes must be greater than 0."),
      })
    ).optional(),
    notes: z.string().optional(),
  });

export async function addCrewDocket(data: z.infer<typeof addCrewDocketSchema>) {
    const validation = addCrewDocketSchema.safeParse(data);

    if (!validation.success) {
        console.error("Add crew docket validation failed:", validation.error.flatten());
        return { success: false, error: "Invalid data submitted." };
    }

    const { productiveHours, unproductiveEntries, ...docketData } = validation.data;
    
    const users = await readUsers();
    const supervisor = users.find(u => u.id === docketData.submittedById);
    if (!supervisor) {
        return { success: false, error: "Supervisor not found." };
    }

    const allDockets = await readCrewDockets();
    const allTimesheets = await readTimesheets();
    
    const allCrewForSubmission = [...new Set([...docketData.crewMemberIds, docketData.submittedById])];

    const newDocket: CrewDocket = {
        id: `DOCKET-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...docketData,
        company: supervisor.company,
        crewMemberIds: allCrewForSubmission,
        submittedAt: new Date(),
        status: 'Submitted',
    };

    allDockets.unshift(newDocket);

    for (const crewMemberId of allCrewForSubmission) {
        const newTimesheet: Timesheet = {
            id: `TS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            crewDocketId: newDocket.id,
            crewMemberId: crewMemberId,
            company: newDocket.company,
            submittedById: newDocket.submittedById,
            productiveHours: productiveHours,
            unproductiveEntries: unproductiveEntries || [],
            status: 'Submitted',
        };
        allTimesheets.unshift(newTimesheet);
    }
    
    await writeCrewDockets(allDockets);
    await writeTimesheets(allTimesheets);

    revalidatePath('/admin', 'layout');
    revalidatePath('/timesheet', 'layout');
    revalidatePath('/reports', 'layout');
    
    return { success: true, docketId: newDocket.id };
}


const updateCrewDocketSchema = z.object({
  crewDocketId: z.string(),
  timesheetDate: z.coerce.date(),
  crewMemberIds: z.array(z.string()),
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  asset: z.string().min(1, "Asset is required."),
  subAsset: z.string().min(1, "Sub-asset is required."),
  activityId: z.string().min(1, "Activity is required."),
  productiveHours: z.coerce.number().min(0, "Productive hours must be positive."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      minutes: z.coerce.number().min(1, "Minutes must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
});


export async function updateCrewDocket(data: z.infer<typeof updateCrewDocketSchema>) {
    const validationResult = updateCrewDocketSchema.safeParse(data);
    if (!validationResult.success) {
        console.error("Update crew docket validation error:", validationResult.error.flatten());
        return { success: false, error: validationResult.error.flatten() };
    }
    
    const { crewDocketId, productiveHours, unproductiveEntries, ...docketUpdates } = validationResult.data;
    
    const allDockets = await readCrewDockets();
    const allTimesheets = await readTimesheets();

    const docketIndex = allDockets.findIndex(d => d.id === crewDocketId);
    if (docketIndex === -1) {
        return { success: false, error: "Crew docket not found." };
    }

    const originalDocket = allDockets[docketIndex];
    const allCrewForSubmission = [...new Set([...docketUpdates.crewMemberIds, originalDocket.submittedById])];
    
    // Update the docket
    const updatedDocket: CrewDocket = {
        ...originalDocket,
        ...docketUpdates,
        crewMemberIds: allCrewForSubmission,
        // If a rejected docket is edited, it should go back to "Submitted"
        status: originalDocket.status === 'Rejected' ? 'Submitted' : originalDocket.status,
    };
    allDockets[docketIndex] = updatedDocket;

    
    // Remove old timesheets for this docket
    const otherTimesheets = allTimesheets.filter(t => t.crewDocketId !== crewDocketId);

    // Create new timesheets for the updated crew
    const newTimesheets: Timesheet[] = allCrewForSubmission.map(crewMemberId => ({
        id: `TS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        crewDocketId: crewDocketId,
        crewMemberId: crewMemberId,
        company: updatedDocket.company,
        submittedById: updatedDocket.submittedById,
        productiveHours: productiveHours,
        unproductiveEntries: unproductiveEntries || [],
        status: updatedDocket.status, // Match the docket's new status
    }));

    const finalTimesheets = [...otherTimesheets, ...newTimesheets];

    await writeCrewDockets(allDockets);
    await writeTimesheets(finalTimesheets);
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/timesheet', 'layout');
    revalidatePath('/reports', 'layout');
    return { success: true };
}


export async function deleteCrewDocket(crewDocketId: string) {
    const allDockets = await readCrewDockets();
    const allTimesheets = await readTimesheets();

    const filteredDockets = allDockets.filter(d => d.id !== crewDocketId);
    const filteredTimesheets = allTimesheets.filter(t => t.crewDocketId !== crewDocketId);
    
    if (allDockets.length === filteredDockets.length) {
         return { success: false, error: "Crew docket not found." };
    }

    await writeCrewDockets(filteredDockets);
    await writeTimesheets(filteredTimesheets);
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/timesheet', 'layout');
    revalidatePath('/reports', 'layout');
    return { success: true };
}


export async function updateDocketStatus(requestingUserId: string, crewDocketId: string, newStatus: 'Approved' | 'Rejected') {
    const allUsers = await readUsers();
    const currentUser = allUsers.find(u => u.id === requestingUserId);
    
    if (currentUser?.appRole !== 'MEI Supervisor') {
        return { success: false, error: "Permission denied." };
    }

    const allDockets = await readCrewDockets();
    const docketIndex = allDockets.findIndex(d => d.id === crewDocketId);

    if (docketIndex === -1) {
        return { success: false, error: "Crew docket not found." };
    }

    if (allDockets[docketIndex].status !== 'Submitted') {
        return { success: false, error: `Cannot change status of a docket that is already ${allDockets[docketIndex].status}.` };
    }

    allDockets[docketIndex].status = newStatus;

    const allTimesheets = await readTimesheets();
    const updatedTimesheets = allTimesheets.map(ts => {
        if (ts.crewDocketId === crewDocketId) {
            return { ...ts, status: newStatus as TimesheetStatus };
        }
        return ts;
    });

    await writeCrewDockets(allDockets);
    await writeTimesheets(updatedTimesheets);

    revalidatePath('/admin', 'layout');
    revalidatePath('/timesheet', 'layout');
    revalidatePath('/reports', 'layout');

    return { success: true, message: `Docket ${newStatus.toLowerCase()}.` };
}

async function enrichCrewDockets(dockets: CrewDocket[]): Promise<CrewDocketWithDetails[]> {
    const allUsers = await readUsers();
    const allActivities = await getActivities();
    const allTimesheets = await readTimesheets();

    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const activityMap = new Map(allActivities.map(a => [a.id, a]));
    const timesheetMap = new Map<string, Timesheet[]>();

    for(const timesheet of allTimesheets) {
        if(!timesheetMap.has(timesheet.crewDocketId)) {
            timesheetMap.set(timesheet.crewDocketId, []);
        }
        timesheetMap.get(timesheet.crewDocketId)!.push(timesheet);
    }


    return dockets.map(docket => ({
        ...docket,
        timesheets: timesheetMap.get(docket.id) || [],
        activity: activityMap.get(docket.activityId) ?? null,
        submittedBy: userMap.get(docket.submittedById) ?? null,
        crewMembers: docket.crewMemberIds.map(id => userMap.get(id)).filter(Boolean) as User[],
    }));
}


export async function getCrewDockets(
    requestingUser?: User | null
): Promise<CrewDocketWithDetails[]> {
    const allDockets = await readCrewDockets();
    const currentUser = requestingUser ?? await getCurrentUser();

    if (!currentUser) {
        return [];
    }

    let filteredDockets: CrewDocket[];
    const isSparkUser = ['Admin', 'MEI Supervisor', 'Read Only'].includes(currentUser.appRole);

    if (isSparkUser) {
        // Spark Admins, Supervisors and Read Only see all dockets from all companies
        filteredDockets = allDockets;
    } else if (currentUser.appRole === 'Subcontractor Admin') {
        // Subcontractor Admin sees all dockets for their company
        filteredDockets = allDockets.filter(s => s.company === currentUser.company);
    } else if (currentUser.appRole === 'Crew Supervisor') {
         // Crew Supervisor on the "My Crew Dockets" page sees only dockets they have submitted.
         // On the approval dashboard, MEI Supervisors need to see submitted dockets from others.
        if (currentUser.appRole === 'MEI Supervisor') {
             filteredDockets = allDockets.filter(d => d.status === 'Submitted');
        } else {
             filteredDockets = allDockets.filter(s => s.submittedById === currentUser.id);
        }
    } else {
         // Default to no dockets if role is not recognized or just a crew member
        filteredDockets = [];
    }
    
    const sorted = filteredDockets.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return enrichCrewDockets(sorted);
}


// Server-side helper to get user from cookie
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('currentUser');
    if (userCookie?.value) {
        try {
            return JSON.parse(userCookie.value);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// User Admin Actions
export async function getUsers(requestingUser?: User | null): Promise<User[]> {
    let users = await readUsers();
    
    const currentUser = requestingUser ?? await getCurrentUser();

    if (currentUser?.appRole === 'Subcontractor Admin') {
        users = users.filter(u => u.company === currentUser.company);
    }
    
    return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

const userSchema = z.object({
    id: z.string().optional(),
    fullName: z.string().min(1, "Full name is required."),
    company: z.string().min(1, "Company is required."),
    appRole: z.enum(['Crew Member', 'Crew Supervisor', 'Admin', 'Subcontractor Admin', 'MEI Supervisor', 'Read Only']),
});

export async function saveUser(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validationResult = userSchema.safeParse(rawData);

    if (!validationResult.success) {
        return { success: false, error: validationResult.error.flatten() };
    }
    
    const { id, ...data } = validationResult.data;
    const users = await readUsers();

    if (id) {
        // Update existing user
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex > -1) {
            users[userIndex] = { ...users[userIndex], ...data };
        } else {
             return { success: false, error: "User not. found" };
        }
    } else {
        // Add new user
        const newUser: User = {
            id: `user-${Date.now()}`,
            ...data,
        };
        users.push(newUser);
    }
    
    await writeUsers(users);
    revalidatePath('/admin/users');
    revalidatePath('/');
    return { success: true };
}


export async function deleteUser(userId: string) {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users.splice(userIndex, 1);
        await writeUsers(users);
        revalidatePath('/admin/users');
        revalidatePath('/');
        return { success: true };
    }
    return { success: false, error: "User not found." };
}

export async function getTimesheets(requestingUser?: User | null): Promise<TimesheetWithDetails[]> {
    const allTimesheets = await readTimesheets();
    const allUsers = await readUsers();
    const allDockets = await readCrewDockets();

    const currentUser = requestingUser ?? await getCurrentUser();

    if (!currentUser) {
        return [];
    }

    let relevantTimesheets: Timesheet[];

    const isSparkUser = ['Admin', 'MEI Supervisor', 'Read Only'].includes(currentUser.appRole);

    if (isSparkUser) {
        relevantTimesheets = allTimesheets;
    } else {
        // Sub-contractor roles see only their company's timesheets
        relevantTimesheets = allTimesheets.filter(t => t.company === currentUser.company);
    }


    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const docketMap = new Map(allDockets.map(d => [d.id, d]));

    const enrichedTimesheets: TimesheetWithDetails[] = relevantTimesheets.map(ts => {
        const docket = docketMap.get(ts.crewDocketId);
        if (!docket) return null; // Should not happen if data is consistent

        return {
            ...ts,
            crewMember: userMap.get(ts.crewMemberId) ?? null,
            submittedBy: userMap.get(ts.submittedById) ?? null,
            crewDocket: docket
        }
    }).filter((ts): ts is TimesheetWithDetails => ts !== null); // Type guard to filter out nulls

    return enrichedTimesheets.sort((a,b) => b.crewDocket.timesheetDate.getTime() - a.crewDocket.timesheetDate.getTime());
}


export async function getAvailableModels() {
    const models = await listModels();
    return models;
}


// CONFIGURATION ACTIONS
const locationSchema = z.object({
  id: z.string().optional(), // Used to identify which location is being edited
  zone: z.string().min(1, 'Zone is required'),
  section: z.string().min(1, 'Section is required'),
  isNewZone: z.boolean().optional()
});

export async function saveLocation(data: z.infer<typeof locationSchema>) {
    const validation = locationSchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Invalid data" };
    
    const { id, zone, section, isNewZone } = validation.data;
    const locations = await readLocations();

    if (isNewZone) {
         if (locations.some(l => l.zone === zone)) {
            return { success: false, error: 'This Zone already exists.' };
        }
        locations.push({ zone: zone, sections: [section] });
    } else {
        const zoneToUpdate = locations.find(l => l.zone === zone);
        if (!zoneToUpdate) {
            return { success: false, error: 'Zone not found.' };
        }

        if (id) { // Editing existing section
            const originalSection = id; // The id passed is the original section name
            if (zoneToUpdate.sections.includes(section) && section !== originalSection) {
                 return { success: false, error: 'This Section already exists in this Zone.' };
            }
            const sectionIndex = zoneToUpdate.sections.findIndex(s => s === originalSection);
            if (sectionIndex > -1) {
                zoneToUpdate.sections[sectionIndex] = section;
            } else {
                 return { success: false, error: 'Original section not found for editing.' };
            }
        } else { // Adding new section to existing zone
             if (zoneToUpdate.sections.includes(section)) {
                return { success: false, error: 'This Section already exists in this Zone.' };
            }
            zoneToUpdate.sections.push(section);
        }
    }
    
    await writeLocations(locations.sort((a, b) => a.zone.localeCompare(b.zone)));
    revalidatePath('/admin/configuration');
    return { success: true };
}

export async function deleteLocation(zone: string, section: string) {
    const locations = await readLocations();
    const zoneToUpdate = locations.find(l => l.zone === zone);

    if (!zoneToUpdate) {
        return { success: false, error: 'Zone not found.' };
    }

    const initialSectionCount = zoneToUpdate.sections.length;
    zoneToUpdate.sections = zoneToUpdate.sections.filter(s => s !== section);
    
    if(zoneToUpdate.sections.length === 0) {
        // If the last section is removed, remove the zone itself
        const zoneIndex = locations.findIndex(l => l.zone === zone);
        locations.splice(zoneIndex, 1);
    }

    if (zoneToUpdate.sections.length === initialSectionCount && locations.some(l => l.zone === zone)) {
        return { success: false, error: 'Section not found in the specified zone.' };
    }

    await writeLocations(locations);
    revalidatePath('/admin/configuration');
    return { success: true };
}


const activitySchema = z.object({
    id: z.string().optional(),
    asset: z.string().min(1, 'Asset is required'),
    subAsset: z.string().min(1, 'Sub-Asset is required'),
    activity: z.string().min(1, 'Activity is required'),
    activityUom: z.string().min(1, 'UoM is required'),
    wbsCode: z.string().min(1, 'WBS Code is required'),
});

export async function saveActivity(data: z.infer<typeof activitySchema>) {
    const validation = activitySchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Invalid data" };

    const { id, ...newActivityData } = validation.data;
    const activities = await readActivities();

    if (id) {
        const index = activities.findIndex(a => a.id === id);
        if (index > -1) {
            activities[index] = { ...activities[index], ...newActivityData };
        } else {
            return { success: false, error: 'Activity not found' };
        }
    } else {
        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            contract: 'C-456', // Default value
            zone: 'S1', // Default value
            section: 'M011', // Default value
            ...newActivityData,
        };
        activities.push(newActivity);
    }
    await writeActivities(activities);
    revalidatePath('/admin/configuration');
    return { success: true };
}


export async function deleteActivity(id: string) {
    const activities = await readActivities();
    const newActivities = activities.filter(a => a.id !== id);
    if (activities.length === newActivities.length) {
        return { success: false, error: 'Activity not found' };
    }
    await writeActivities(newActivities);
    revalidatePath('/admin/configuration');
    return { success: true };
}

const unproductiveReasonSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(1, 'Code is required'),
    reason: z.string().min(1, 'Reason is required'),
    uom: z.string().min(1, 'UoM is required'),
});

export async function saveUnproductiveReason(data: z.infer<typeof unproductiveReasonSchema>) {
    const validation = unproductiveReasonSchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Invalid data" };
    
    const { id, ...newReasonData } = validation.data;
    const reasons = await readUnproductiveReasons();

    if (id) {
        const index = reasons.findIndex(r => r.id === id);
        if (index > -1) {
            reasons[index] = { ...reasons[index], ...newReasonData };
        } else {
            return { success: false, error: 'Reason not found' };
        }
    } else {
        const newReason: UnproductiveReason = {
            id: `unprod-${Date.now()}`,
            ...newReasonData
        };
        reasons.push(newReason);
    }

    await writeUnproductiveReasons(reasons);
    revalidatePath('/admin/configuration');
    return { success: true };
}

export async function deleteUnproductiveReason(id: string) {
    const reasons = await readUnproductiveReasons();
    const newReasons = reasons.filter(r => r.id !== id);
    if (reasons.length === newReasons.length) {
        return { success: false, error: 'Reason not found' };
    }
    await writeUnproductiveReasons(newReasons);
    revalidatePath('/admin/configuration');
    return { success: true };
}

