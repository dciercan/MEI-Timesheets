
'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from "@/components/AdminDashboard";
import { getTimesheetSubmissions } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import type { TimesheetSubmissionWithDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyCompanySubmissionsPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [submissions, setSubmissions] = useState<TimesheetSubmissionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            getTimesheetSubmissions(currentUser, 'report')
                .then(data => {
                    setSubmissions(data);
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
    
    if (submissions.length === 0) {
        return (
            <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">All {currentUser.company} Submissions</CardTitle>
                        <CardDescription>A log of all timesheet submissions from your company.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <ListTodo className="h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-2xl font-semibold font-headline">No Timesheets Submitted Yet</h2>
                            <p className="mt-2 text-muted-foreground">Check back later to see submissions from your company's crew supervisors.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">All {currentUser.company} Submissions</CardTitle>
                    <CardDescription>A log of all timesheet submissions from your company.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminDashboard submissions={submissions} />
                </CardContent>
            </Card>
        </div>
    );
}
