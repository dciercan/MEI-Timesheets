
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const pathname = usePathname();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        // This effect runs once on mount to handle the initial auth check.
        // It prevents a flash of the login page if the user is already authenticated.
        if (!isAuthLoading) {
            setIsCheckingAuth(false);
        }
    }, [isAuthLoading]);

    // Show a full-page skeleton ONLY during the very initial auth check.
    if (isCheckingAuth) {
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
    
    // After the initial check, if a user exists, show the full authenticated layout.
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
    
    // If no user exists, it's a public page (login).
    // The middleware ensures only the root path is accessible without a user.
    return <>{children}</>;
}
