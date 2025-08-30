
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted) {
            return; 
        }

        const isAuthPage = pathname === '/';
        const isAdminSection = pathname.startsWith('/admin');

        if (!user && !isAuthPage) {
            // If not logged in and not on the login page, redirect to login
            router.push('/');
        } else if (user && isAuthPage) {
            // If logged in and on the login page, redirect to the appropriate dashboard
            if (user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin') {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
        } else if (user && (user.appRole !== 'Admin' && user.appRole !== 'Subcontractor Admin') && isAdminSection) {
            // If a non-admin user tries to access an admin page, redirect them
            router.push('/timesheet');
        }

    }, [user, isLoading, pathname, isMounted, router]);

    // Show a loading state while we determine auth status
    if (isLoading || !isMounted) {
        return null; 
    }
    
    // Prevent flicker of content during redirect
    const isAuthPage = pathname === '/';
    if ((user && isAuthPage) || (!user && !isAuthPage)) {
        return null;
    }

    return <>{children}</>;
}
