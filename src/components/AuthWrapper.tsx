
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
    
    // If a user is logged in, show the main app layout with the header.
    // The middleware will handle redirecting them to the correct dashboard.
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

    // When no user is logged in (and not loading), just render the children.
    // This allows public pages like the Welcome/Login screen to display.
    return <>{children}</>;
}
