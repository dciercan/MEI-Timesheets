
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Logo from './Logo';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) {
            return; // Wait for the auth state to be determined
        }

        const isAuthPage = pathname === '/';

        if (!user && !isAuthPage) {
            // If not logged in and not on the login page, redirect to login
            window.location.href = '/';
        } else if (user && isAuthPage) {
            // If logged in and on the login page, redirect to the appropriate dashboard
             if (user.appRole === 'Admin') {
                window.location.href = '/admin';
             } else {
                window.location.href = '/timesheet';
             }
        }
    }, [user, isLoading, pathname]);
    
    // While loading, or if a redirect is imminent, show a loading screen.
    // This prevents the "flicker" of showing a page's content before redirecting.
    if (isLoading || (user && pathname === '/') || (!user && pathname !== '/')) {
         return (
             <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className='mb-8'>
                    <Logo />
                </div>
                <div className="space-y-4 text-center w-full max-w-sm p-4">
                    <p>Loading session...</p>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full mt-6" />
                </div>
            </div>
        );
    }
    
    // If we've loaded and are on the correct page, show the page content.
    return <>{children}</>;
}
