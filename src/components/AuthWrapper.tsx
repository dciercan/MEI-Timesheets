
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
                    </div>
                </header>
                <main className="flex-grow container mx-auto p-4">
                    <div className="flex items-center justify-center flex-grow h-[80vh]">
                         <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        );
    }
    
    // If we are done loading and have a user, show the full authenticated layout.
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
    
    // If we are done loading and there is no user, it's a public page (login).
    // The middleware ensures only the root path is accessible without a user.
    return <>{children}</>;
}
