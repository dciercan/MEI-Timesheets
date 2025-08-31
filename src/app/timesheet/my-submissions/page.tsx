
'use client';

import { useState, useEffect } from 'react';
import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getTimesheetSubmissions } from "@/lib/actions";
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetSubmissionWithDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupervisorSubmissionsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [submissions, setSubmissions] = useState<TimesheetSubmissionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getTimesheetSubmissions(user)
                .then(data => {
                    setSubmissions(data);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isAuthLoading) {
            // If there's no user and auth is done loading, we can stop loading the page data.
            setIsLoading(false);
        }
    }, [user, isAuthLoading]);

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
    
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <SupervisorDashboard submissions={submissions} />
        </div>
    );
}
