
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

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
    
    // If loading is finished and we still don't have a user,
    // it means the user is on the login page (enforced by middleware).
    // In that case, we should render nothing from the wrapper.
    if (!user) {
        return null;
    }

    // If loading is finished and we have a user, render the children.
    return <>{children}</>;
}
