
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// Function to set a cookie
const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  if (typeof document !== 'undefined') {
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  }
};

// Function to get a cookie
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') {
        return null;
    }
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
};

// Function to erase a cookie
const eraseCookie = (name: string) => {   
    if (typeof document !== 'undefined') {
        document.cookie = name+'=; Max-Age=-99999999; path=/;';  
    }
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    try {
      const userCookie = getCookie('currentUser');
      if (userCookie) {
        setUser(JSON.parse(userCookie));
      }
    } catch (e) {
        // Corrupted cookie, clear it
        eraseCookie('currentUser');
        setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, []);


  const login = useCallback((userToLogin: User) => {
    setCookie('currentUser', JSON.stringify(userToLogin), 7);
    setUser(userToLogin);
  }, []);

  const logout = useCallback(() => {
    eraseCookie('currentUser');
    setUser(null);
    router.push('/');
  }, [router]);

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
