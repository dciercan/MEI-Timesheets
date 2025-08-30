
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, Loader2 } from 'lucide-react';
import Logo from './Logo';
import { useRouter } from 'next/navigation';

interface WelcomeProps {
  users: User[];
}

export default function Welcome({ users }: WelcomeProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const companies = useMemo(() => [...new Set(users.map(u => u.company))], [users]);
  
  const filteredUsers = useMemo(() => {
    if (!selectedCompany) return [];
    
    // Admins can log in as anyone, but normal users are restricted.
    // The main admin company is 'Spark'.
    if (selectedCompany === 'Spark') {
        return users.filter(u => u.company === selectedCompany && u.appRole === 'Admin');
    }

    // Subcontractor Admins and Crew Supervisors are the only roles that can log in from the welcome screen
    // for non-admin companies.
    return users.filter(u => u.company === selectedCompany && (u.appRole === 'Crew Supervisor' || u.appRole === 'Subcontractor Admin'));

  }, [selectedCompany, users]);

  const handleLogin = () => {
    if (!selectedUserId) {
        setError('Please select your name to continue.');
        return;
    }
    const userToLogin = users.find(u => u.id === selectedUserId);
    if (userToLogin) {
      setIsLoggingIn(true);
      login(userToLogin);

      // Redirect after setting the cookie
      const isAdmin = userToLogin.appRole === 'Admin' || userToLogin.appRole === 'Subcontractor Admin';
      const targetUrl = isAdmin ? '/admin' : '/timesheet';
      router.push(targetUrl);
      
    } else {
        setError('Could not find user. Please try again.');
        setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className='mx-auto w-auto mb-4'>
                <Logo />
            </div>
          <CardTitle className="font-headline text-3xl">Welcome</CardTitle>
          <CardDescription>Please select your company and name to proceed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="company-select" className="text-sm font-medium">Company</label>
            <Select onValueChange={(value) => {
                setSelectedCompany(value);
                setSelectedUserId('');
                setError('');
            }} value={selectedCompany}>
              <SelectTrigger id="company-select">
                <SelectValue placeholder="Select your company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="user-select" className="text-sm font-medium">Your Name</label>
             <Select onValueChange={(value) => {
                setSelectedUserId(value)
                setError('');
             }} value={selectedUserId} disabled={!selectedCompany}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                    ))
                ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No supervisors or admins available for this company.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} className="w-full" size="lg" disabled={!selectedUserId || isLoggingIn}>
            {isLoggingIn ? <Loader2 className="mr-2 animate-spin" /> : <LogIn className="mr-2" />}
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
