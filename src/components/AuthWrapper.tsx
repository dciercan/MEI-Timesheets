
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

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
        
        // If not logged in, redirect to login page from any other page.
        if (!user && !isAuthPage) {
            router.replace('/');
            return;
        }

        if (user) {
            const isUserAdmin = user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin';

            // If logged in, redirect from login page to the appropriate dashboard.
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

    // While loading, or if a redirect is imminent, show a skeleton or nothing at all
    // to prevent flashing unauthorized content.
    if (isLoading) {
         return (
            <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </header>
                <main className="flex-grow container mx-auto p-4">
                    <Skeleton className="h-96 w-full" />
                </main>
            </div>
        );
    }

    const isAuthPage = pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');
    
    if (!user && !isAuthPage) {
        return null; // Redirecting to login
    }
    
    if (user) {
        const isUserAdmin = user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin';
        if (isAuthPage) {
            return null; // Redirecting to dashboard
        }
        if (isAdminRoute && !isUserAdmin) {
            return null; // Redirecting to timesheet
        }
    }
    
    // If all checks pass, the user is authorized to see the page.
    return <>{children}</>;
}
