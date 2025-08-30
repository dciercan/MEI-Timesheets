'use server';

import { revalidatePath } from 'next/cache';
import { timesheetSubmissions } from './data';
import type { TimesheetSubmission } from './types';

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
    
    return { success: true, submission: newSubmission };
}


export async function getTimesheetSubmissions(): Promise<TimesheetSubmission[]> {
    // In a real app, this would fetch from a database.
    // Sorting by submittedAt descending to show newest first.
    return Promise.resolve(timesheetSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
}
