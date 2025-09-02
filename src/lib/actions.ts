

'use server';

import { revalidatePath } from 'next/cache';
import type { User, Activity, UnproductiveReason, CrewDocket, Timesheet, CrewDocketWithDetails, TimesheetWithDetails, CrewDocketStatus, TimesheetStatus, Location } from './types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { listModels } from 'genkit';
import { startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

const MELBOURNE_TZ = 'Australia/Melbourne';

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
         return JSON.parse(data).map((t: any) => ({ ...t, shiftStart: new Date(t.shiftStart), shiftEnd: new Date(t.shiftEnd) }));
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
    try {
        await fs.access(activitiesDbPath);
        const data = await fs.readFile(activitiesDbPath, 'utf-8');
        if (data.trim() === '') return [];
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
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
    const locations = await readLocations();
    return locations.sort((a, b) => a.zone.localeCompare(b.zone) || a.section.localeCompare(b.section));
}

export async function getZones(): Promise<string[]> {
    const locations = await readLocations();
    return [...new Set(locations.map(l => l.zone))].sort((a,b) => a.localeCompare(b));
}

export async function getSections(): Promise<string[]> {
    const locations = await readLocations();
    const allSections = new Set<string>();
    locations.forEach(l => {
        allSections.add(l.section);
    });
    return Array.from(allSections).sort((a,b) => a.localeCompare(b));
}


// Schema for the main timesheet form
const addCrewDocketSchema = z.object({
  submittedById: z.string().min(1, "Supervisor is required."),
  shiftStart: z.coerce.date({ required_error: "A start date is required." }),
  shiftEnd: z.coerce.date({ required_error: "An end date is required." }),
  crewMemberIds: z.array(z.string()), // Can be empty if supervisor is only crew member
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  asset: z.string().min(1, "Please select an asset."),
  subAsset: z.string().min(1, "Please select a sub-asset."),
  activityId: z.string().min(1, "Please select an activity."),
  productiveHours: z.any().transform(val => val === '' ? undefined : Number(val)).pipe(z.number({ required_error: "Productive hours are required."}).min(0, "Productive hours must be a positive number.")),
  quantity: z.any().transform(val => val === '' ? undefined : Number(val)).pipe(z.number({ required_error: "Quantity is required."}).min(0, "Quantity is required.")),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      hours: z.coerce.number().min(0.1, "Hours must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
}).refine((data) => {
    if (!data.shiftStart || !data.shiftEnd) return true;
    return data.shiftEnd > data.shiftStart;
}, {
    message: "End date/time must be after start date/time.",
    path: ["shiftEnd"],
});

export async function addCrewDocket(data: z.infer<typeof addCrewDocketSchema>) {
    const validation = addCrewDocketSchema.safeParse(data);

    if (!validation.success) {
        console.error("Add crew docket validation failed:", validation.error.flatten());
        return { success: false, error: "Invalid data submitted." };
    }

    const { productiveHours, unproductiveEntries, shiftStart, shiftEnd, ...docketData } = validation.data;
    
    const users = await readUsers();
    const supervisor = users.find(u => u.id === docketData.submittedById);
    if (!supervisor) {
        return { success: false, error: "Supervisor not found." };
    }

    const allDockets = await readCrewDockets();
    const allTimesheets = await readTimesheets();
    
    const allCrewForSubmission = [...new Set([...docketData.crewMemberIds, docketData.submittedById])];

    const melbourneShiftStart = zonedTimeToUtc(shiftStart, MELBOURNE_TZ);

    const newDocket: CrewDocket = {
        id: `CD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
        ...docketData,
        timesheetDate: startOfDay(melbourneShiftStart),
        company: supervisor.company,
        crewMemberIds: allCrewForSubmission,
        submittedAt: new Date(),
        status: 'Submitted',
    };

    allDockets.unshift(newDocket);

    for (const crewMemberId of allCrewForSubmission) {
        const newTimesheet: Timesheet = {
            id: `TS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
            crewDocketId: newDocket.id,
            crewMemberId: crewMemberId,
            company: newDocket.company,
            submittedById: newDocket.submittedById,
            productiveHours: productiveHours,
            unproductiveEntries: unproductiveEntries || [],
            status: 'Submitted',
            shiftStart,
            shiftEnd,
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
  shiftStart: z.coerce.date(),
  shiftEnd: z.coerce.date(),
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
      hours: z.coerce.number().min(0.1, "Hours must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
}).refine((data) => data.shiftEnd > data.shiftStart, {
    message: "End date must be after start date.",
    path: ["shiftEnd"],
});


export async function updateCrewDocket(data: z.infer<typeof updateCrewDocketSchema>) {
    const validationResult = updateCrewDocketSchema.safeParse(data);
    if (!validationResult.success) {
        console.error("Update crew docket validation error:", validationResult.error.flatten());
        return { success: false, error: validationResult.error.flatten() };
    }
    
    const { crewDocketId, productiveHours, unproductiveEntries, shiftStart, shiftEnd, ...docketUpdates } = validationResult.data;
    
    const allDockets = await readCrewDockets();
    const allTimesheets = await readTimesheets();

    const docketIndex = allDockets.findIndex(d => d.id === crewDocketId);
    if (docketIndex === -1) {
        return { success: false, error: "Crew docket not found." };
    }

    const originalDocket = allDockets[docketIndex];
    const allCrewForSubmission = [...new Set([...docketUpdates.crewMemberIds, originalDocket.submittedById])];
    
    const melbourneShiftStart = zonedTimeToUtc(shiftStart, MELBOURNE_TZ);

    // Update the docket
    const updatedDocket: CrewDocket = {
        ...originalDocket,
        ...docketUpdates,
        timesheetDate: startOfDay(melbourneShiftStart),
        crewMemberIds: allCrewForSubmission,
        // If a rejected docket is edited, it should go back to "Submitted"
        status: originalDocket.status === 'Rejected' ? 'Submitted' : originalDocket.status,
    };
    allDockets[docketIndex] = updatedDocket;

    
    // Remove old timesheets for this docket
    const otherTimesheets = allTimesheets.filter(t => t.crewDocketId !== crewDocketId);

    // Create new timesheets for the updated crew
    const newTimesheets: Timesheet[] = allCrewForSubmission.map(crewMemberId => ({
        id: `TS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
        crewDocketId: crewDocketId,
        crewMemberId: crewMemberId,
        company: updatedDocket.company,
        submittedById: updatedDocket.submittedById,
        productiveHours: productiveHours,
        unproductiveEntries: unproductiveEntries || [],
        status: updatedDocket.status, // Match the docket's new status
        shiftStart,
        shiftEnd,
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
    const currentUser = await getCurrentUser();

    const docketToDelete = allDockets.find(d => d.id === crewDocketId);
    if (!docketToDelete) {
        return { success: false, error: "Crew docket not found." };
    }

    if (!currentUser) {
        return { success: false, error: "User not found." };
    }

    const isOwner = docketToDelete.submittedById === currentUser.id;
    const isAdmin = currentUser.appRole === 'Admin';
    const isDeletableStatus = ['Submitted', 'Rejected'].includes(docketToDelete.status);

    if (!isAdmin && !(isOwner && isDeletableStatus)) {
        return { success: false, error: "Permission denied. You cannot delete this docket." };
    }

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
        if (currentUser.appRole === 'MEI Supervisor') {
            filteredDockets = allDockets.filter(d => d.status === 'Submitted' || d.status === 'Approved');
        } else {
            filteredDockets = allDockets;
        }
    } else if (currentUser.appRole === 'Subcontractor Admin') {
        filteredDockets = allDockets.filter(s => s.company === currentUser.company);
    } else if (currentUser.appRole === 'Crew Supervisor') {
         filteredDockets = allDockets.filter(s => s.submittedById === currentUser.id);
    } else {
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
  DAMid: z.coerce.number().min(10000, "DAMid must be a 5-digit number.").max(99999, "DAMid must be a 5-digit number."),
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
            const existingDAMid = users[userIndex].DAMid;
            if(data.DAMid !== existingDAMid && users.some(u => u.DAMid === data.DAMid)) {
                return { success: false, error: { formErrors: [], fieldErrors: { DAMid: ["This DAMid is already in use."] } }};
            }
            users[userIndex] = { ...users[userIndex], ...data };
        } else {
             return { success: false, error: "User not. found" };
        }
    } else {
        // Add new user
        if(users.some(u => u.DAMid === data.DAMid)) {
            return { success: false, error: { formErrors: [], fieldErrors: { DAMid: ["This DAMid is already in use."] } }};
        }
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
  id: z.string().optional(),
  zone: z.string().min(1, 'Zone is required'),
  section: z.string().min(1, 'Section is required'),
  isActive: z.boolean().default(true),
});

export async function saveLocation(data: z.infer<typeof locationSchema>) {
    const validation = locationSchema.safeParse(data);
    if (!validation.success) return { success: false, error: "Invalid data" };
    
    const { id, zone, section, isActive } = validation.data;
    const locations = await readLocations();

    const generatedId = `${zone}-${section}`;
    
    if (id) { // Editing existing location
        const index = locations.findIndex(l => l.id === id);
        if (index > -1) {
            // Check if the new ID conflicts with another existing location
            if (generatedId !== id && locations.some(l => l.id === generatedId)) {
                return { success: false, error: 'This Zone/Section combination already exists.' };
            }
            locations[index] = { id: generatedId, zone, section, isActive };
        } else {
            return { success: false, error: 'Location not found for editing.' };
        }
    } else { // Adding new location
        if (locations.some(l => l.id === generatedId)) {
            return { success: false, error: 'This Zone/Section combination already exists.' };
        }
        locations.push({ id: generatedId, zone, section, isActive });
    }
    
    await writeLocations(locations);
    revalidatePath('/admin/configuration');
    return { success: true };
}

export async function deleteLocation(id: string) {
    const locations = await readLocations();
    const newLocations = locations.filter(l => l.id !== id);

    if (locations.length === newLocations.length) {
        return { success: false, error: 'Location not found.' };
    }

    await writeLocations(newLocations);
    revalidatePath('/admin/configuration');
    return { success: true };
}

export async function toggleLocationStatus(id: string, newStatus: boolean) {
    const locations = await readLocations();
    const index = locations.findIndex(l => l.id === id);
    if (index > -1) {
        locations[index].isActive = newStatus;
        await writeLocations(locations);
        revalidatePath('/admin/configuration');
        return { success: true };
    }
    return { success: false, error: 'Location not found.' };
}


const activitySchema = z.object({
    id: z.string().optional(),
    asset: z.string().min(1, 'Asset is required'),
    subAsset: z.string().min(1, 'Sub-Asset is required'),
    activity: z.string().min(1, 'Activity is required'),
    activityUom: z.string().min(1, 'UoM is required'),
    isActive: z.boolean().default(true),
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
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

export async function toggleActivityStatus(id: string, newStatus: boolean) {
    const activities = await readActivities();
    const index = activities.findIndex(a => a.id === id);
    if (index > -1) {
        activities[index].isActive = newStatus;
        await writeActivities(activities);
        revalidatePath('/admin/configuration');
        return { success: true };
    }
    return { success: false, error: 'Activity not found.' };
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

const importLocationsSchema = z.object({
  locations: z.array(z.object({
    zone: z.string().trim().min(1),
    section: z.string().trim().min(1),
  })),
  deleteMissing: z.boolean(),
});

export async function importLocations(data: z.infer<typeof importLocationsSchema>) {
    const validation = importLocationsSchema.safeParse(data);
    if (!validation.success) {
      console.error("Import locations validation error:", validation.error.flatten());
      return { success: false, error: "Invalid data format. Ensure 'zone' and 'section' columns are mapped and every row has a value." };
    }
  
    const { locations: importedRows, deleteMissing } = validation.data;
    const existingLocations = await readLocations();
  
    // Create a map of new locations for efficient lookup.
    // The key is a composite "zone-section" to handle uniqueness.
    const newLocationsMap = new Map<string, { zone: string; section: string }>();
    for (const { zone, section } of importedRows) {
        const key = `${zone}-${section}`;
        if (!newLocationsMap.has(key)) {
            newLocationsMap.set(key, { zone, section });
        }
    }
  
    let finalLocations: Location[] = [];
  
    if (deleteMissing) {
        // If deleting, the new data is the complete source of truth.
        // All imported locations are considered active.
        finalLocations = Array.from(newLocationsMap.values()).map(loc => ({
            id: `${loc.zone}-${loc.section}`,
            ...loc,
            isActive: true
        }));
    } else {
        // Merge with existing data.
        const mergedLocationsMap = new Map<string, Location>();
  
        // Add all existing locations to the map first.
        for (const loc of existingLocations) {
            mergedLocationsMap.set(loc.id, loc);
        }
  
        // Add or update with new locations. If it exists, we just ensure it's there.
        // If it doesn't, we add it as active.
        for (const [key, value] of newLocationsMap.entries()) {
            if (!mergedLocationsMap.has(key)) {
                mergedLocationsMap.set(key, {
                    id: key,
                    zone: value.zone,
                    section: value.section,
                    isActive: true
                });
            }
        }
        finalLocations = Array.from(mergedLocationsMap.values());
    }
  
    // Sort for consistency
    finalLocations.sort((a, b) => a.id.localeCompare(b.id));
    
    await writeLocations(finalLocations);
    revalidatePath('/admin/configuration');
  
    // Accurate reporting based on what was actually changed.
    const initialCount = existingLocations.length;
    const finalCount = finalLocations.length;
    let createdCount = 0;
    let deletedCount = 0;

    if (deleteMissing) {
        const existingIds = new Set(existingLocations.map(l => l.id));
        const finalIds = new Set(finalLocations.map(l => l.id));
        
        createdCount = finalLocations.filter(l => !existingIds.has(l.id)).length;
        deletedCount = existingLocations.filter(l => !finalIds.has(l.id)).length;
    } else {
        createdCount = Math.max(0, finalCount - initialCount);
    }
    
    return { 
        success: true, 
        report: {
            created: createdCount,
            updated: 0, 
            deleted: deletedCount,
            total: finalCount,
        }
    };
}
    
const importActivitiesSchema = z.object({
  activities: z.array(z.object({
    asset: z.string().trim().min(1),
    subAsset: z.string().trim().min(1),
    activity: z.string().trim().min(1),
    activityUom: z.string().trim().min(1),
  })),
  deleteMissing: z.boolean(),
});

export async function importActivities(data: z.infer<typeof importActivitiesSchema>) {
    const validation = importActivitiesSchema.safeParse(data);
    if (!validation.success) {
      console.error("Import activities validation error:", validation.error.flatten());
      return { success: false, error: "Invalid data format. Ensure all required columns are mapped and every row has values." };
    }
  
    const { activities: importedRows, deleteMissing } = validation.data;
    const existingActivities = await readActivities();
  
    // Use a composite key for uniqueness: asset-subAsset-activity
    const createKey = (act: { asset: string; subAsset: string; activity: string; }) => 
        `${act.asset}-${act.subAsset}-${act.activity}`.toLowerCase();

    const newActivitiesMap = new Map<string, Omit<Activity, 'id'>>();
    for (const row of importedRows) {
        const key = createKey(row);
        if (!newActivitiesMap.has(key)) {
            newActivitiesMap.set(key, {
                ...row,
                isActive: true,
                contract: 'C-456', // Default value
                zone: 'S1', // Default value
                section: 'M011', // Default value
            });
        }
    }
  
    let finalActivities: Activity[] = [];
    let createdCount = 0;
    let updatedCount = 0;
  
    if (deleteMissing) {
        finalActivities = Array.from(newActivitiesMap.values()).map(act => ({
            ...act,
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
        }));
    } else {
        const mergedActivitiesMap = new Map<string, Activity>();
        for (const act of existingActivities) {
            mergedActivitiesMap.set(createKey(act), act);
        }

        for (const [key, value] of newActivitiesMap.entries()) {
            if (mergedActivitiesMap.has(key)) {
                // Update existing activity
                const existingActivity = mergedActivitiesMap.get(key)!;
                mergedActivitiesMap.set(key, {
                    ...existingActivity,
                    activityUom: value.activityUom,
                });
                updatedCount++;
            } else {
                // Add new activity
                mergedActivitiesMap.set(key, {
                    ...value,
                    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                });
                createdCount++;
            }
        }
        finalActivities = Array.from(mergedActivitiesMap.values());
    }
  
    finalActivities.sort((a, b) => a.asset.localeCompare(b.asset) || a.subAsset.localeCompare(b.subAsset) || a.activity.localeCompare(b.activity));
    
    await writeActivities(finalActivities);
    revalidatePath('/admin/configuration');

    const deletedCount = deleteMissing ? Math.max(0, existingActivities.length - newActivitiesMap.size) : 0;
    if (deleteMissing) {
      const existingKeys = new Set(existingActivities.map(createKey));
      createdCount = Array.from(newActivitiesMap.keys()).filter(key => !existingKeys.has(key)).length;
      updatedCount = newActivitiesMap.size - createdCount;
    }

    return { 
        success: true, 
        report: {
            created: createdCount,
            updated: updatedCount,
            deleted: deletedCount,
            total: finalActivities.length,
        }
    };
}
