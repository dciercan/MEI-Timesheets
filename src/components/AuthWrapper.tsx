
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
    
    // Show a full-page loading skeleton only if we are still loading AND not on the initial server render.
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
        )
    }

    const isAuthPage = pathname === '/';
    // On the server, or after loading, if we're on the auth page, render it.
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    // If we have a user, we can render the children.
    if (user) {
        return <>{children}</>;
    }

    // Otherwise, we are likely redirecting, so render nothing to avoid flicker.
    return null;
}
