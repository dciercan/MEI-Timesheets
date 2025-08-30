
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Logo from './Logo';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted) {
            return; // Wait for auth state to load and component to be mounted
        }

        const isAuthPage = pathname === '/';

        if (!user && !isAuthPage) {
            router.replace('/');
        } else if (user && isAuthPage) {
             if (user.appRole === 'Admin') {
                router.replace('/admin');
             } else {
                router.replace('/timesheet');
             }
        }
    }, [user, isLoading, router, pathname, isMounted]);

    if (!isMounted) {
        return null; // Render nothing on the server and on initial client render to prevent hydration mismatch
    }

    // While loading, if we're not on an auth page, show a skeleton loader.
    if (isLoading && pathname !== '/') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className='mb-8'>
                    <Logo />
                </div>
                <div className="space-y-4 text-center w-full max-w-sm p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full mt-6" />
                </div>
            </div>
        );
    }
    
    // If we're on the login page, always render it, regardless of auth state.
    // The useEffect will handle redirection if the user is already logged in.
    if (pathname === '/') {
        return <>{children}</>;
    }

    // For any other page, if we have a user, render the content.
    if (user) {
        return <>{children}</>;
    }

    // If there's no user and we're not on the login page, we are likely redirecting.
    // Return a loader to avoid flashing content.
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <div className='mb-8'>
                <Logo />
            </div>
            <div className="space-y-4 text-center w-full max-w-sm p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full mt-6" />
            </div>
        </div>
    );
}
