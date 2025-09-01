
'use client';

import { useEffect, useState } from 'react';
import { getUsers } from "@/lib/actions";
import type { User } from '@/lib/types';
import SubcontractorUserAdmin from "@/components/SubcontractorUserAdmin";
import SparkUserAdmin from "@/components/SparkUserAdmin";
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserAdminPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!isAuthLoading && currentUser) {
            setIsLoading(true);
            getUsers(currentUser).then(fetchedUsers => {
                setUsers(fetchedUsers);
                setIsLoading(false);
            });
        }
    }, [currentUser, isAuthLoading]);

    if (isAuthLoading || isLoading || !currentUser) {
        return (
             <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                    <Skeleton className="h-8 w-1/2" />
                    <div className="border rounded-lg p-4 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    const isSparkAdmin = currentUser.appRole === 'Admin';

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            {isSparkAdmin ? (
                <SparkUserAdmin initialUsers={users} currentUser={currentUser} />
            ) : (
                <SubcontractorUserAdmin initialUsers={users} currentUser={currentUser} />
            )}
        </div>
    );
}
