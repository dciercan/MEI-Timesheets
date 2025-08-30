
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A helper function to manage cookies
function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Check if running on the client side before accessing document
    if (typeof window !== 'undefined') {
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }
}

function getCookie(name: string) {
    // Check if running on the client side before accessing document
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
}

function eraseCookie(name: string) {   
    // Check if running on the client side before accessing document
    if (typeof window !== 'undefined') {
        document.cookie = name+'=; Max-Age=-99999999; path=/';  
    }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to initialize auth state from cookie.
    const initializeAuth = () => {
        try {
          const storedUser = getCookie('currentUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.error("Failed to parse user from cookie", error);
          eraseCookie('currentUser');
        } finally {
          setIsLoading(false);
        }
    };
    initializeAuth();
  }, []);

  const login = (userToLogin: User) => {
    setCookie('currentUser', JSON.stringify(userToLogin), 7); // Store for 7 days
    setUser(userToLogin); // Update state immediately
    // Force a full page reload to ensure server components get the new cookie.
    if (userToLogin.appRole === 'Admin') {
        window.location.href = '/admin';
    } else {
        window.location.href = '/timesheet';
    }
  };

  const logout = () => {
    eraseCookie('currentUser');
    setUser(null);
    // Force a full page reload to ensure server components recognize the logged-out state.
    window.location.href = '/';
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
