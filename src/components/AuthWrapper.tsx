
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
            return; // Wait until the user's auth state is determined
        }

        const isAuthPage = pathname === '/';
        const isAdminRoute = pathname.startsWith('/admin');
        const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

        // Scenario 1: User is not logged in
        if (!user) {
            if (!isAuthPage) {
                router.push('/');
            }
            return;
        }

        // At this point, we know the user is logged in.

        // Scenario 2: Logged-in user is on the login page
        if (isAuthPage) {
            if (isUserAdmin) {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
            return;
        }
        
        // Scenario 3: A non-admin user tries to access an admin route
        if (isAdminRoute && !isUserAdmin) {
             router.push('/timesheet');
             return;
        }

    }, [user, isLoading, pathname, router]);

    // --- Render Logic ---
    // This logic determines what to show while redirects are happening
    // to prevent content flashing.

    if (isLoading) {
        return null; // Show nothing while loading
    }

    const isAuthPage = pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');
    const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

    // If not logged in, only show the login page.
    // Other pages will be blank during the redirect.
    if (!user) {
        return isAuthPage ? <>{children}</> : null;
    }

    // If logged in, don't show the login page.
    // It will be blank during the redirect.
    if (isAuthPage) {
        return null;
    }

    // If a non-admin tries to access admin pages,
    // show nothing during the redirect.
    if (isAdminRoute && !isUserAdmin) {
        return null;
    }
    
    // If all checks pass, the user is authorized to see the page.
    return <>{children}</>;
}
