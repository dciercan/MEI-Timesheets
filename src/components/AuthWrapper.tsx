
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            const isAuthPage = pathname === '/';
            if (!user && !isAuthPage) {
                router.replace('/');
            } else if (user && isAuthPage) {
                 if (user.appRole === 'Timesheet Admin') {
                    router.replace('/admin');
                 } else {
                    router.replace('/timesheet');
                 }
            }
        }
    }, [user, isLoading, router, pathname]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="space-y-4 text-center">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-6 w-64 mx-auto" />
                    <Skeleton className="h-12 w-80 mx-auto mt-6" />
                </div>
            </div>
        )
    }

    const isAuthPage = pathname === '/';

    // Don't show header/children on the auth page
    if (isAuthPage && !user) {
        return <>{children}</>;
    }

    // If user is logged in, but tries to access auth page, show redirecting...
    if (isAuthPage && user) {
        return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
    }

    // If no user and not on auth page, show redirecting
    if (!user && !isAuthPage) {
        return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
    }

    // If everything is fine, show the main content
    return <>{children}</>;
}
