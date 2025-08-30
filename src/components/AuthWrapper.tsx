
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted) {
            return; // Wait for auth state to be determined and component to be mounted
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
    }, [user, isLoading, pathname, isMounted]);

    if (isLoading || !isMounted) {
        return null; // Render nothing until auth state is confirmed and mounted
    }
    
    // Logic to prevent showing content that will be redirected away from
    const isAuthPage = pathname === '/';
    if ((user && isAuthPage) || (!user && !isAuthPage)) {
        return null; // Render nothing during the brief moment before redirection
    }

    return <>{children}</>;
}
