
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = pathname === '/';
    const isAdminSection = pathname.startsWith('/admin');
    const isUserAdmin = user?.appRole === 'Admin' || user?.appRole === 'Subcontractor Admin';

    useEffect(() => {
        if (isLoading) {
            return;
        }

        // 1. Not logged in, but trying to access a protected page
        if (!user && !isAuthPage) {
            router.push('/');
            return;
        }

        // 2. Logged in, but on the auth page (should be redirected)
        if (user && isAuthPage) {
            if (isUserAdmin) {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
            return;
        }
        
        // 3. Logged in, but trying to access an unauthorized page
        if (user && isAdminSection && !isUserAdmin) {
             router.push('/timesheet');
             return;
        }

    }, [user, isLoading, pathname, router, isAuthPage, isAdminSection, isUserAdmin]);

    
    // Render logic to prevent flicker during redirects
    if (isLoading) {
        return null;
    }

    if (!user) {
        // If not logged in, only render the auth page.
        // Other pages will be blank while redirecting.
        return isAuthPage ? <>{children}</> : null;
    }
    
    // If user is logged in, they should not see the auth page.
    // It will be blank while redirecting.
    if (isAuthPage) {
        return null;
    }

    // If a non-admin tries to access admin pages,
    // they will be blank while redirecting.
    if (isAdminSection && !isUserAdmin) {
        return null;
    }

    // If all checks pass, the user is authorized.
    return <>{children}</>;
}
