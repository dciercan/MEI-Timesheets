'use client';

import { useState, useEffect } from 'react';
import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getSupervisorSubmissions } from "@/lib/actions";
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetSubmission } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function SupervisorSubmissionsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [submissions, setSubmissions] = useState<TimesheetSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && user) {
            getSupervisorSubmissions(user.id)
                .then(data => {
                    setSubmissions(data);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isAuthLoading && !user) {
            // User is not logged in, AuthWrapper will redirect
            setIsLoading(false);
        }
    }, [user, isAuthLoading]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
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
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <SupervisorDashboard submissions={submissions} />
        </div>
    );
}
