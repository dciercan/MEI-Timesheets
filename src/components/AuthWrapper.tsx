
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
    
    // While loading or before the component has mounted, show a full-page loader.
    // This prevents content flashing and ensures we don't make redirect decisions prematurely.
    if (isLoading || !isMounted) {
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

    // If we are in the process of redirecting, show a simple "Redirecting..." message.
    if ((user && isAuthPage) || (!user && !isAuthPage)) {
         return (
             <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className='mb-8'>
                    <Logo />
                </div>
                <p>Redirecting...</p>
            </div>
        );
    }
    
    // If all checks pass, render the children components.
    return <>{children}</>;
}
