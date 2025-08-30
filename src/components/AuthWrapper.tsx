
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        const isAuthPage = pathname === '/';
        const isAdminSection = pathname.startsWith('/admin');

        // Case 1: User is NOT logged in.
        if (!user) {
            // If they are trying to access anything other than the login page, redirect them.
            if (!isAuthPage) {
                router.push('/');
            }
            return;
        }

        // Case 2: User IS logged in.
        // If they are on the login page, redirect them to their appropriate dashboard.
        if (isAuthPage) {
            if (user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin') {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
            return;
        }

        // If a non-admin user tries to access an admin page, redirect them away.
        if ((user.appRole !== 'Admin' && user.appRole !== 'Subcontractor Admin') && isAdminSection) {
            router.push('/timesheet');
            return;
        }

    }, [user, isLoading, pathname, router]);

    // Render logic to prevent flicker during redirects
    if (isLoading) {
        return null; // Don't render anything while loading
    }
    
    const isAuthPage = pathname === '/';
    const isAdminSection = pathname.startsWith('/admin');

    if (!user) {
        // If not logged in, only render the login page.
        // On other pages, a redirect is happening, so we render null.
        return isAuthPage ? <>{children}</> : null;
    }

    // If logged in...
    if (isAuthPage) {
        // A redirect is happening away from the login page, so render null.
        return null;
    }
    
    if ((user.appRole !== 'Admin' && user.appRole !== 'Subcontractor Admin') && isAdminSection) {
        // A redirect is happening away from the admin section, so render null.
        return null;
    }

    // If we've reached this point, the user is authorized for the current page.
    return <>{children}</>;
}
