
'use client';

import { useAuth } from '@/hooks/use-auth';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const isPublicPage = pathname === '/';
        if (!user && !isPublicPage) {
            router.push('/');
        }
    }, [user, pathname, router]);

    const isPublicPage = pathname === '/';

    if (isPublicPage) {
        return <>{children}</>
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
            {/* You might want a loader here */}
        </div>
    );
}
