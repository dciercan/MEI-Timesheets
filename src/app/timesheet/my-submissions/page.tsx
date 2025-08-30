
'use client';

import { useState, useEffect } from 'react';
import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getSupervisorSubmissions } from "@/lib/actions";
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetSubmissionWithDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo } from 'lucide-react';

export default function SupervisorSubmissionsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [submissions, setSubmissions] = useState<TimesheetSubmissionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getSupervisorSubmissions(user.id)
                .then(data => {
                    setSubmissions(data);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [user]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-8 w-1/2" />
                    <div className="border rounded-lg p-4 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
          <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <ListTodo className="h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-2xl font-semibold font-headline">No Timesheets Submitted Yet</h2>
                <p className="mt-2 text-muted-foreground">Once you submit timesheets, they will appear here.</p>
            </div>
          </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <SupervisorDashboard submissions={submissions} />
        </div>
    );
}
