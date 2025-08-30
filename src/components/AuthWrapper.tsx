
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Header from './Header';
import { usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    // Show a full-page loading skeleton only during the initial auth check
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
    
    // If the user is logged in, show the header and the page content
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

    // If the user is not logged in (and not loading), show the page content directly
    // This allows public pages like the login page to render.
    // The middleware is responsible for protecting routes.
    return <>{children}</>;
}
