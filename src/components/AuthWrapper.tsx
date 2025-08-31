
'use client';

import { useAuth } from '@/hooks/use-auth';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return; // Wait until auth state is loaded

        const isPublicPage = pathname === '/';
        if (!user && !isPublicPage) {
            router.push('/');
        }
    }, [user, pathname, router, isLoading]);

    const isPublicPage = pathname === '/';

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLoading) {
       return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between h-16">
                            <Skeleton className="h-10 w-1/4" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        </div>
                        <main className="pt-8">
                             <Skeleton className="h-96 w-full" />
                        </main>
                    </div>
                </div>
            </div>
        )
    }

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

    // While redirecting, show a loader or nothing
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
             <p>Redirecting...</p>
        </div>
    );
}
