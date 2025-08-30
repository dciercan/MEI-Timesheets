
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

        // Scenario 1: User is not logged in.
        if (!user) {
            if (!isAuthPage) {
                // If not on login page, redirect there.
                router.replace('/');
            }
            return;
        }

        // Scenario 2: User is logged in.
        if (isAuthPage) {
            // If on the login page, redirect to their dashboard.
            if (isUserAdmin) {
                router.replace('/admin');
            } else {
                router.replace('/timesheet');
            }
            return;
        }
        
        // Scenario 3: A non-admin user tries to access an admin route.
        if (isAdminRoute && !isUserAdmin) {
            router.replace('/timesheet');
            return;
        }

    }, [user, isLoading, pathname, router]);

    // --- Render Logic ---
    // This logic prevents flashing content during redirects.
    
    // While loading, don't render anything.
    if (isLoading) {
        return null;
    }

    const isAuthPage = pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');
    const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

    // If a redirect is imminent, show nothing to prevent flicker.
    if (!user && !isAuthPage) {
        return null; // Will be redirected by useEffect.
    }
    if (user && isAuthPage) {
        return null; // Will be redirected by useEffect.
    }
    if (user && isAdminRoute && !isUserAdmin) {
        return null; // Will be redirected by useEffect.
    }
    
    // If all checks pass, the user is authorized to see the page content.
    return <>{children}</>;
}
