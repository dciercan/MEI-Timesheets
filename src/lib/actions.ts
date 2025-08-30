
'use server';

import { revalidatePath } from 'next/cache';
import type { TimesheetSubmission, User } from './types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { activities, unproductiveReasons } from './data';

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


const addTimesheetSchema = z.object({
    submittedById: z.string(),
    timesheetDate: z.coerce.date(),
    crewMemberIds: z.array(z.string()).min(1),
    zone: z.string(),
    section: z.string(),
    asset: z.string(),
    subAsset: z.string(),
    activityId: z.string(),
    productiveHours: z.coerce.number(),
    quantity: z.coerce.number(),
    unproductiveEntries: z.array(z.object({
        reasonId: z.string(),
        hours: z.coerce.number(),
    })).optional(),
    notes: z.string().optional(),
});


export async function addTimesheet(data: z.infer<typeof addTimesheetSchema>) {
    const validation = addTimesheetSchema.safeParse(data);

    if (!validation.success) {
        console.error("Add timesheet validation failed:", validation.error.flatten());
        return { success: false, error: "Invalid data submitted." };
    }

    const { crewMemberIds, submittedById, ...submissionData } = validation.data;
    const newSubmissionIds: string[] = [];
    const allSubmissions = await readSubmissions();

    for (const crewMemberId of crewMemberIds) {
        const newSubmission: TimesheetSubmission = {
            id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            crewMemberId: crewMemberId,
            timesheetDate: submissionData.timesheetDate,
            zone: submissionData.zone,
            section: submissionData.section,
            asset: submissionData.asset,
            subAsset: submissionData.subAsset,
            activityId: submissionData.activityId,
            productiveHours: submissionData.productiveHours,
            quantity: submissionData.quantity,
            unproductiveEntries: submissionData.unproductiveEntries || [],
            notes: submissionData.notes,
            submittedAt: new Date(),
            submittedById: submittedById,
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
    notes: z.string().optional(),
  });

export async function updateTimesheet(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validationResult = timesheetSchema.safeParse(rawData);

    if (!validationResult.success) {
        return { success: false, error: validationResult.error.flatten() };
    }

    const { id, ...data } = validationResult.data;
    const allSubmissions = await readSubmissions();
    const submissionIndex = allSubmissions.findIndex(s => s.id === id);

    if (submissionIndex > -1) {
        allSubmissions[submissionIndex] = {
            ...allSubmissions[submissionIndex],
            ...data,
            timesheetDate: new Date(data.timesheetDate)
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


export async function getTimesheetSubmissions(): Promise<TimesheetSubmission[]> {
    const submissions = await readSubmissions();
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function getSupervisorSubmissions(supervisorId: string): Promise<TimesheetSubmission[]> {
    const allSubmissions = await readSubmissions();
    const submissions = allSubmissions.filter(s => s.submittedById === supervisorId);
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}


// User Admin Actions
export async function getUsers(): Promise<User[]> {
    const users = await readUsers();
    return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

const userSchema = z.object({
    id: z.string().optional(),
    fullName: z.string().min(1, "Full name is required."),
    company: z.string().min(1, "Company is required."),
    appRole: z.enum(['Crew Member', 'Crew Supervisor', 'Admin']),
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
    const allActivities = await Promise.resolve(activities);
    return allActivities.find(a => a.id === activityId);
}

export async function findUnproductiveReasonById(reasonId: string): Promise<any | undefined> {
    const reasons = await Promise.resolve(unproductiveReasons);
    return reasons.find(r => r.id === reasonId);
}
