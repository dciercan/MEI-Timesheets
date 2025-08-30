
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const isAuthPage = pathname === '/';
        const isAdminSection = pathname.startsWith('/admin');
        const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

        // 1. User is not logged in
        if (!user) {
            if (!isAuthPage) {
                router.push('/');
            }
            return;
        }

        // 2. User is logged in
        // Redirect from auth page to appropriate dashboard
        if (isAuthPage) {
            if (isUserAdmin) {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
            return;
        }

        // Redirect non-admins trying to access admin section
        if (isAdminSection && !isUserAdmin) {
            router.push('/timesheet');
            return;
        }

    }, [user, isLoading, pathname, router]);

    // This section determines what to render to avoid page flicker during redirects.
    if (isLoading) {
        return null; // Render nothing while waiting for auth state
    }

    const isAuthPage = pathname === '/';
    const isAdminSection = pathname.startsWith('/admin');
    const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

    // While redirecting, we want to render null to avoid showing the wrong page.
    if (!user) {
        // If not logged in, only show the login page.
        return isAuthPage ? <>{children}</> : null;
    }

    // If logged in and on the login page, a redirect is happening.
    if (isAuthPage) {
        return null;
    }
    
    // If a non-admin is trying to access admin pages, a redirect is happening.
    if (isAdminSection && !isUserAdmin) {
        return null;
    }

    // If all checks pass, the user is authorized for the current page.
    return <>{children}</>;
}
