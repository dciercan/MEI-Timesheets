
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userToLogin: User) => {
    setUser(userToLogin);
    localStorage.setItem('currentUser', JSON.stringify(userToLogin));
    if (userToLogin.appRole === 'Timesheet Admin') {
        router.push('/admin');
    } else {
        router.push('/timesheet');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            const isAuthPage = pathname === '/';
            if (!user && !isAuthPage) {
                router.replace('/');
            } else if (user && isAuthPage) {
                 if (user.appRole === 'Timesheet Admin') {
                    router.replace('/admin');
                 } else {
                    router.replace('/timesheet');
                 }
            }
        }
    }, [user, isLoading, router, pathname]);
    
    // While loading, you can show a loader or nothing
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const isAuthPage = pathname === '/';
    if (!user && !isAuthPage) {
        return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
    }

    if (user && isAuthPage) {
        return <div className="flex items-center justify-center h-screen">Redirecting to dashboard...</div>;
    }

    return <>{children}</>;
}
