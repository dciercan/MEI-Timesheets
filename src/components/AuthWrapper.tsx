
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
        const isAdminRoute = pathname.startsWith('/admin');
        const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

        // Scenario 1: User is not logged in, and not on the auth page.
        // Redirect them to the login page.
        if (!user && !isAuthPage) {
            router.replace('/');
            return;
        }

        // Scenario 2: User is logged in.
        if (user) {
            // If they are on the login page, redirect them to their dashboard.
            if (isAuthPage) {
                if (isUserAdmin) {
                    router.replace('/admin');
                } else {
                    router.replace('/timesheet');
                }
                return;
            }

            // If a non-admin user tries to access an admin route, redirect them.
            if (isAdminRoute && !isUserAdmin) {
                router.replace('/timesheet');
                return;
            }
        }
    }, [user, isLoading, pathname, router]);

    // --- Render Logic ---
    // This logic prevents flashing content during redirects.
    
    if (isLoading) {
        return null;
    }

    const isAuthPage = pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');
    const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

    // While loading, or if a redirect is imminent, show nothing.
    if (!user && !isAuthPage) {
        return null;
    }
    if (user && isAuthPage) {
        return null;
    }
    if (user && isAdminRoute && !isUserAdmin) {
        return null;
    }

    // If all checks pass, the user is authorized to see the page.
    return <>{children}</>;
}
