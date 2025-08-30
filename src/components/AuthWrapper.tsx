
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

        // If user is not logged in and not on the login page, redirect to login.
        if (!user && !isAuthPage) {
            router.push('/');
            return;
        }

        if (user) {
            // If user is logged in and on the login page, redirect to their dashboard.
            if (isAuthPage) {
                if (user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin') {
                    router.push('/admin');
                } else {
                    router.push('/timesheet');
                }
                return;
            }

            // If a non-admin user tries to access an admin page, redirect them.
            if ((user.appRole !== 'Admin' && user.appRole !== 'Subcontractor Admin') && isAdminSection) {
                router.push('/timesheet');
                return;
            }
        }
    }, [user, isLoading, pathname, isMounted, router]);


    if (isLoading || !isMounted) {
        return null; // Show nothing while determining auth state
    }
    
    // To prevent content flicker during redirects, we determine if the content should be rendered.
    const isAuthPage = pathname === '/';
    const isAdminSection = pathname.startsWith('/admin');

    if (!user) {
        // If not logged in, only render the auth page.
        // Other pages will trigger a redirect, so we render null to avoid flicker.
        return isAuthPage ? <>{children}</> : null;
    }

    // If logged in...
    // Don't render the login page.
    if (isAuthPage) {
        return null;
    }

    // If a non-admin is trying to access admin pages, don't render them.
    if ((user.appRole !== 'Admin' && user.appRole !== 'Subcontractor Admin') && isAdminSection) {
        return null;
    }

    // Otherwise, the user is authorized for this page.
    return <>{children}</>;
}
