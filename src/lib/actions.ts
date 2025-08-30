
'use server';

import { revalidatePath } from 'next/cache';
import type { TimesheetSubmission, User, Activity, UnproductiveReason, TimesheetSubmissionWithDetails } from './types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';

// In a real app, you would use a proper database.
// For this demo, we'll use a JSON file for persistence.
const submissionsDbPath = path.join(process.cwd(), 'src', 'lib', 'submissions.json');
const usersDbPath = path.join(process.cwd(), 'src', 'lib', 'users.json');

// Submissions Data Functions
async function readSubmissions(): Promise<TimesheetSubmission[]> {
    try {
        await fs.access(submissionsDbPath);
        const data = await fs.readFile(submissionsDbPath, 'utf-8');
        if (data.trim() === '') return [];
        const submissions = JSON.parse(data);
        return submissions.map((s: any) => ({
            ...s,
            timesheetDate: new Date(s.timesheetDate),
            submittedAt: new Date(s.submittedAt),
        }));
    } catch (error) {
        return [];
    }
}

async function writeSubmissions(submissions: TimesheetSubmission[]): Promise<void> {
    await fs.writeFile(submissionsDbPath, JSON.stringify(submissions, null, 2), 'utf-8');
}

// Users Data Functions
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

// Read-only data functions
async function readActivities(): Promise<Activity[]> {
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'activities.json'), 'utf-8');
    return JSON.parse(data);
}

async function readUnproductiveReasons(): Promise<UnproductiveReason[]> {
    const data = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'unproductiveReasons.json'), 'utf-8');
    return JSON.parse(data);
}


const addTimesheetSchema = z.object({
    submittedById: z.string().min(1, "Supervisor is required."),
    timesheetDate: z.coerce.date(),
    crewMemberIds: z.array(z.string()).min(1, "Please select at least one crew member."),
    zone: z.string().min(1, "Zone is required."),
    section: z.string().min(1, "Section is required."),
    asset: z.string().min(1, "Please select an asset."),
    subAsset: z.string().min(1, "Please select a sub-asset."),
    activityId: z.string().min(1, "Please select an activity."),
    productiveHours: z.coerce.number().min(0.1, "Productive hours must be greater than 0."),
    quantity: z.coerce.number().min(0, "Quantity is required."),
    unproductiveEntries: z.array(
      z.object({
        reasonId: z.string().min(1, "Please select a reason."),
        hours: z.coerce.number().min(1, "Minutes must be greater than 0."),
      })
    ).optional(),
    notes: z.string().optional(),
  });


export async function addTimesheet(data: z.infer<typeof addTimesheetSchema>) {
    const validation = addTimesheetSchema.safeParse(data);

    if (!validation.success) {
        console.error("Add timesheet validation failed:", validation.error.flatten());
        return { success: false, error: "Invalid data submitted." };
    }

    const { crewMemberIds, ...submissionData } = validation.data;
    const allSubmissions = await readSubmissions();
    const newSubmissionIds: string[] = [];

    // The supervisor is also a crew member for the submission.
    // The crewMemberIds array from the form only contains the *other* crew members.
    const allCrewForSubmission = [...new Set([...crewMemberIds, submissionData.submittedById])];

    for (const crewMemberId of allCrewForSubmission) {
        const newSubmission: TimesheetSubmission = {
            id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...submissionData,
            crewMemberId,
            unproductiveEntries: submissionData.unproductiveEntries || [],
            submittedAt: new Date(),
        };
        allSubmissions.unshift(newSubmission);
        newSubmissionIds.push(newSubmission.id);
    }
    
    await writeSubmissions(allSubmissions);

    revalidatePath('/admin');
    revalidatePath('/timesheet/my-submissions');
    
    return { success: true, submissionIds: newSubmissionIds };
}

const timesheetSchema = z.object({
    id: z.string(),
    timesheetDate: z.coerce.date(),
    crewMemberId: z.string().min(1, "Crew member is required."),
    asset: z.string().min(1, "Asset is required."),
    subAsset: z.string().min(1, "Sub-asset is required."),
    activityId: z.string().min(1, "Activity is required."),
    productiveHours: z.coerce.number().min(0.1, "Productive hours must be greater than 0."),
    quantity: z.coerce.number().min(0, "Quantity is required."),
    unproductiveEntries: z.array(
        z.object({
          reasonId: z.string().min(1, "Please select a reason."),
          hours: z.coerce.number().min(1, "Minutes must be greater than 0."),
        })
      ).optional(),
    notes: z.string().optional(),
  });

export async function updateTimesheet(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Manual parsing for array of objects
    const unproductiveEntries: any[] = [];
    for (const key in rawData) {
        if (key.startsWith('unproductiveEntries')) {
            const match = key.match(/unproductiveEntries\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = parseInt(match[1], 10);
                const property = match[2];
                if (!unproductiveEntries[index]) {
                    unproductiveEntries[index] = {};
                }
                unproductiveEntries[index][property] = rawData[key];
            }
        }
    }
    const finalRawData = {...rawData, unproductiveEntries: unproductiveEntries.filter(Boolean)};


    const validationResult = timesheetSchema.safeParse(finalRawData);

    if (!validationResult.success) {
        console.error("Update validation error:", validationResult.error.flatten());
        return { success: false, error: validationResult.error.flatten() };
    }

    const { id, ...data } = validationResult.data;
    const allSubmissions = await readSubmissions();
    const submissionIndex = allSubmissions.findIndex(s => s.id === id);

    if (submissionIndex > -1) {
        allSubmissions[submissionIndex] = {
            ...allSubmissions[submissionIndex],
            ...data,
            timesheetDate: new Date(data.timesheetDate),
            unproductiveEntries: data.unproductiveEntries || [],
        };
        await writeSubmissions(allSubmissions);
        revalidatePath('/admin');
        revalidatePath('/timesheet/my-submissions');
        return { success: true };
    }
    return { success: false, error: "Submission not found." };
}

export async function deleteTimesheet(submissionId: string) {
    const allSubmissions = await readSubmissions();
    const filteredSubmissions = allSubmissions.filter(s => s.id !== submissionId);
    
    if (allSubmissions.length === filteredSubmissions.length) {
         return { success: false, error: "Submission not found." };
    }

    await writeSubmissions(filteredSubmissions);
    revalidatePath('/admin');
    revalidatePath('/timesheet/my-submissions');
    return { success: true };
}


async function enrichSubmissions(submissions: TimesheetSubmission[]): Promise<TimesheetSubmissionWithDetails[]> {
    const users = await readUsers();
    const activities = await readActivities();

    const userMap = new Map(users.map(u => [u.id, u]));
    const activityMap = new Map(activities.map(a => [a.id, a]));

    return submissions.map(submission => ({
        ...submission,
        crewMember: userMap.get(submission.crewMemberId) ?? null,
        activity: activityMap.get(submission.activityId) ?? null,
        submittedBy: userMap.get(submission.submittedById) ?? null,
    }));
}


export async function getTimesheetSubmissions(requestingUser?: User | null): Promise<TimesheetSubmissionWithDetails[]> {
    let submissions = await readSubmissions();

    if (requestingUser && requestingUser.appRole !== 'Admin' && requestingUser.appRole !== 'MEI Supervisor') {
        const users = await readUsers();
        const companyUserIds = users
            .filter(u => u.company === requestingUser.company)
            .map(u => u.id);
        
        const companyUserIdsSet = new Set(companyUserIds);
        
        submissions = submissions.filter(s => 
            companyUserIdsSet.has(s.submittedById)
        );
    }
    
    const sorted = submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return enrichSubmissions(sorted);
}

export async function getSupervisorSubmissions(supervisorId: string): Promise<TimesheetSubmissionWithDetails[]> {
    const allSubmissions = await readSubmissions();
    const submissions = allSubmissions.filter(s => s.submittedById === supervisorId);
    const sorted = submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    return enrichSubmissions(sorted);
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
    
    if (requestingUser?.appRole === 'Subcontractor Admin') {
        users = users.filter(u => u.company === requestingUser.company);
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
             return { success: false, error: "User not found." };
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

export async function findUserById(userId: string): Promise<User | undefined> {
    const users = await readUsers();
    return users.find(u => u.id === userId);
}

export async function findActivityById(activityId: string): Promise<Activity | undefined> {
    const allActivities = await readActivities();
    return allActivities.find(a => a.id === activityId);
}

export async function findUnproductiveReasonById(reasonId: string): Promise<any | undefined> {
    const reasons = await readUnproductiveReasons();
    return reasons.find(r => r.id === reasonId);
}

    