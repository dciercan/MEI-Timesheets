
'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from "@/components/AdminDashboard";
import { getCrewDockets } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import type { CrewDocketWithDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyCompanySubmissionsPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [dockets, setDockets] = useState<CrewDocketWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            getCrewDockets(currentUser)
                .then(data => {
                    setDockets(data);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [currentUser]);

    if (isAuthLoading || isLoading || !currentUser) {
        return (
             <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                         <Skeleton className="h-9 w-1/2" />
                         <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    if (dockets.length === 0) {
        return (
            <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">All {currentUser.company} Crew Dockets</CardTitle>
                        <CardDescription>A log of all crew dockets from your company.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <ListTodo className="h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold font-headline">No Dockets Submitted Yet</h2>
                            <p className="mt-2 text-muted-foreground">Check back later to see crew dockets from your company's crew supervisors.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-screen-2xl py-8 px-4 md:px-6">
            <AdminDashboard dockets={dockets} title={`All ${currentUser.company} Crew Dockets`} description="A log of all crew dockets from your company." />
        </div>
    );
}
