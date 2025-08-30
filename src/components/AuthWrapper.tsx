
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Logo from './Logo';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) {
            return; // Do nothing while loading auth state
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
    }, [user, isLoading, router, pathname]);

    // While loading, if we're not on an auth page, show a skeleton loader.
    // This prevents content flashing for protected pages.
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
    // Return null to avoid flashing content before the redirect happens.
    return null;
}
