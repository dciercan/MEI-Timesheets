
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Logo from './Logo';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted) {
            return;
        }

        const isAuthPage = pathname === '/';

        if (!user && !isAuthPage) {
            window.location.href = '/';
        } else if (user && isAuthPage) {
             if (user.appRole === 'Admin') {
                window.location.href = '/admin';
             } else {
                window.location.href = '/timesheet';
             }
        }
    }, [user, isLoading, pathname, isMounted]);

    if (!isMounted || isLoading) {
        // Show a full-page loader to prevent layout shifts and content flashing
        // while we wait for client-side auth state to be confirmed.
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
    
    const isAuthPage = pathname === '/';
    
    // If user is logged in, but on the auth page, we are redirecting, so show loader.
    if(user && isAuthPage) {
         return (
             <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className='mb-8'>
                    <Logo />
                </div>
                <p>Redirecting...</p>
            </div>
        );
    }

    // If user is not logged in and not on auth page, we are redirecting, so show loader.
    if(!user && !isAuthPage) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className='mb-8'>
                    <Logo />
                </div>
                 <p>Redirecting...</p>
            </div>
        );
    }
    
    return <>{children}</>;
}
