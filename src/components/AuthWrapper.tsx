
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Header from './Header';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

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
    
    // If loading is finished, and we have a user, render the authenticated layout.
    // The middleware handles redirecting unauthenticated users from protected pages.
    if (user) {
        return (
             <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                    {children}
                </main>
            </div>
        );
    }

    // If loading is finished and there's no user, it means we are on a public page (e.g., login).
    // In this case, we just render the children for that public page.
    return <>{children}</>;
}
