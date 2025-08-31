

'use server';

import { revalidatePath } from 'next/cache';
import type { User, Activity, UnproductiveReason, CrewDocket, Timesheet, CrewDocketWithDetails, TimesheetWithDetails, CrewDocketStatus, TimesheetStatus } from './types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { listModels } from 'genkit';

// In a real app, you would use a proper database.
const crewDocketsDbPath = path.join(process.cwd(), 'src', 'lib', 'crew-dockets.json');
const timesheetsDbPath = path.join(process.cwd(), 'src', 'lib', 'timesheets.json');
const usersDbPath = path.join(process.cwd(), 'src', 'lib', 'users.json');

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
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'activities.json'), 'utf-8');
    return JSON.parse(data);
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


export async function updateDocketStatus(crewDocketId: string, newStatus: 'Approved' | 'Rejected') {
    const currentUser = await getCurrentUser();
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
    const allActivities = await readActivities();
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
    const isSparkUser = ['Admin', 'Read Only', 'MEI Supervisor'].includes(currentUser.appRole);

    if (isSparkUser) {
        filteredDockets = allDockets;
    } else if (currentUser.appRole === 'Subcontractor Admin') {
        filteredDockets = allDockets.filter(s => s.company === currentUser.company);
    } else if (currentUser.appRole === 'Crew Supervisor') {
        filteredDockets = allDockets.filter(s => s.submittedById === currentUser.id);
    } else {
         // Default to no dockets if role is not recognized
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
    
    // First, find all dockets for the current user's company
    const companyDockets = allDockets.filter(d => d.company === currentUser.company);
    const companyDocketIds = new Set(companyDockets.map(d => d.id));

    // Then, filter timesheets that belong to those dockets
    const companyTimesheets = allTimesheets.filter(t => companyDocketIds.has(t.crewDocketId));

    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const docketMap = new Map(allDockets.map(d => [d.id, d]));

    const enrichedTimesheets: TimesheetWithDetails[] = companyTimesheets.map(ts => {
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
