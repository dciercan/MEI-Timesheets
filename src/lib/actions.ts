
'use server';

import { revalidatePath } from 'next/cache';
import { timesheetSubmissions, users } from './data';
import type { TimesheetSubmission, User } from './types';
import { z } from 'zod';

// In a real app, you would not mutate an in-memory array.
// This is for demonstration purposes only.
export async function addTimesheet(data: Omit<TimesheetSubmission, 'id' | 'submittedAt'>) {
    const newSubmission: TimesheetSubmission = {
        ...data,
        id: `ts-${Date.now()}`,
        submittedAt: new Date(),
    };
    timesheetSubmissions.unshift(newSubmission); // Add to the beginning of the array
    
    // Revalidate the admin path to show the new submission
    revalidatePath('/admin');
    revalidatePath('/timesheet/my-submissions');
    
    return { success: true, submission: newSubmission };
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

    const submissionIndex = timesheetSubmissions.findIndex(s => s.id === id);
    if (submissionIndex > -1) {
        // We are only updating a subset of fields from the edit form.
        // Unproductive entries are not editable in this version.
        timesheetSubmissions[submissionIndex] = {
            ...timesheetSubmissions[submissionIndex],
            ...data,
            timesheetDate: new Date(data.timesheetDate)
        };
        revalidatePath('/admin');
        revalidatePath('/timesheet/my-submissions');
        return { success: true };
    }
    return { success: false, error: "Submission not found." };
}

export async function deleteTimesheet(submissionId: string) {
    const submissionIndex = timesheetSubmissions.findIndex(s => s.id === submissionId);
    if (submissionIndex > -1) {
        timesheetSubmissions.splice(submissionIndex, 1);
        revalidatePath('/admin');
        revalidatePath('/timesheet/my-submissions');
        return { success: true };
    }
    return { success: false, error: "Submission not found." };
}


export async function getTimesheetSubmissions(): Promise<TimesheetSubmission[]> {
    // In a real app, this would fetch from a database.
    // Sorting by submittedAt descending to show newest first.
    return Promise.resolve(timesheetSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
}

export async function getSupervisorSubmissions(supervisorId: string): Promise<TimesheetSubmission[]> {
    const submissions = timesheetSubmissions.filter(s => s.submittedById === supervisorId);
    return Promise.resolve(submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
}


// User Admin Actions
export async function getUsers(): Promise<User[]> {
    return Promise.resolve(users.sort((a, b) => a.fullName.localeCompare(b.fullName)));
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
    
    revalidatePath('/admin/users');
    revalidatePath('/');
    return { success: true };
}


export async function deleteUser(userId: string) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users.splice(userIndex, 1);
        revalidatePath('/admin/users');
        revalidatePath('/');
        return { success: true };
    }
    return { success: false, error: "User not found." };
}
