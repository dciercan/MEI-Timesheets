
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn } from 'lucide-react';
import Logo from './Logo';

interface WelcomeProps {
  users: User[];
}

export default function Welcome({ users }: WelcomeProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const companies = useMemo(() => [...new Set(users.map(u => u.company))], [users]);
  
  const filteredUsers = useMemo(() => {
    if (!selectedCompany) return [];
    if (selectedCompany === 'Spark') {
        return users.filter(u => u.company === 'Spark' && u.appRole === 'Timesheet Admin');
    }
    return users.filter(u => u.company === selectedCompany && u.appRole === 'Crew Supervisor');
  }, [selectedCompany, users]);

  const handleLogin = () => {
    if (!selectedUserId) {
        setError('Please select your name to continue.');
        return;
    }
    const userToLogin = users.find(u => u.id === selectedUserId);
    if (userToLogin) {
      login(userToLogin);
    } else {
        setError('Could not find user. Please try again.');
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
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No users available for this selection.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} className="w-full" size="lg" disabled={!selectedUserId}>
            <LogIn className="mr-2" />
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
