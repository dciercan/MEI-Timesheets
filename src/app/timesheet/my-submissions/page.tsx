
'use client';

import { useState, useEffect } from 'react';
import SupervisorDashboard from "@/components/SupervisorDashboard";
import { getCrewDockets } from "@/lib/actions";
import { useAuth } from '@/hooks/use-auth';
import type { CrewDocketWithDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupervisorSubmissionsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [dockets, setDockets] = useState<CrewDocketWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getCrewDockets(user)
                .then(data => {
                    setDockets(data);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isAuthLoading) {
            setIsLoading(false);
        }
    }, [user, isAuthLoading]);

    const handleDocketDeleted = (docketId: string) => {
        setDockets(currentDockets => currentDockets.filter(docket => docket.id !== docketId));
    }

    if (isAuthLoading || isLoading) {
        return (
            <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
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
        <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
            <SupervisorDashboard dockets={dockets} onDocketDeleted={handleDocketDeleted}/>
        </div>
    );
}
