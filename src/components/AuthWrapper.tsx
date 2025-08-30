
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading || !isMounted) {
            return; 
        }

        const isAuthPage = pathname === '/';

        if (!user && !isAuthPage) {
            router.push('/');
        } else if (user && isAuthPage) {
            if (user.appRole === 'Admin') {
                router.push('/admin');
            } else {
                router.push('/timesheet');
            }
        }
    }, [user, isLoading, pathname, isMounted, router]);

    // Show a loading state while we determine auth status
    if (isLoading || !isMounted) {
        return null; 
    }
    
    // Prevent flicker of content during redirect
    const isAuthPage = pathname === '/';
    if ((user && isAuthPage) || (!user && !isAuthPage)) {
        return null;
    }

    return <>{children}</>;
}
