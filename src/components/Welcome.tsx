
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, Loader2, QrCode, Keyboard } from 'lucide-react';
import Logo from './Logo';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import jsQR from "jsqr";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';


interface WelcomeProps {
  users: User[];
}

export default function Welcome({ users }: WelcomeProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [damId, setDamId] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isScanning) {
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasCameraPermission(true);
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings to use this feature.',
                });
                setIsScanning(false); 
            }
        };
        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }
  }, [isScanning, toast]);
  
  useEffect(() => {
      let animationFrameId: number;

      const scanQRCode = () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
              const video = videoRef.current;
              const canvas = canvasRef.current;
              const context = canvas.getContext('2d');

              if (context) {
                  canvas.height = video.videoHeight;
                  canvas.width = video.videoWidth;
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: "dontInvert",
                  });
                  if (code) {
                      handleDamIdLogin(code.data);
                      setIsScanning(false);
                  }
              }
          }
          if (isScanning) {
              animationFrameId = requestAnimationFrame(scanQRCode);
          }
      };

      if(isScanning) {
        animationFrameId = requestAnimationFrame(scanQRCode);
      }

      return () => {
          cancelAnimationFrame(animationFrameId);
      };

  }, [isScanning]);


  const companies = useMemo(() => [...new Set(users.map(u => u.company))], [users]);
  
  const filteredUsers = useMemo(() => {
    if (!selectedCompany) return [];
    
    if (selectedCompany === 'Spark') {
        return users.filter(u => u.company === selectedCompany && (u.appRole === 'Admin' || u.appRole === 'MEI Supervisor' || u.appRole === 'Read Only'));
    }

    return users.filter(u => u.company === selectedCompany && (u.appRole === 'Crew Supervisor' || u.appRole === 'Subcontractor Admin'));

  }, [selectedCompany, users]);

  useEffect(() => {
    if (user) {
        if (user.appRole === 'Read Only') {
            router.push('/reports');
        } else if (user.appRole === 'MEI Supervisor') {
            router.push('/timesheet/my-submissions');
        } else {
            const isAdmin = user.appRole === 'Admin' || user.appRole === 'Subcontractor Admin';
            const targetUrl = isAdmin ? '/admin' : '/timesheet';
            router.push(targetUrl);
        }
    }
  }, [user, router]);

  const handleDamIdLogin = (id: string | number) => {
      const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
      const userToLogin = users.find(u => u.DAMid === parsedId);
      if (userToLogin) {
          setIsLoggingIn(true);
          login(userToLogin);
      } else {
          setError('Invalid DAMid. Please try again.');
          setIsLoggingIn(false);
      }
  }


  const handleDropdownLogin = async () => {
    if (!selectedUserId) {
        setError('Please select your name to continue.');
        return;
    }
    const userToLogin = users.find(u => u.id === selectedUserId);
    if (userToLogin) {
      setIsLoggingIn(true);
      login(userToLogin);
    } else {
        setError('Could not find user. Please try again.');
        setIsLoggingIn(false);
    }
  };
 
  if (user) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
    <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className='mx-auto w-auto mb-4'>
                <Logo />
            </div>
        <CardTitle className="font-headline text-3xl">Welcome</CardTitle>
        <CardDescription>Please sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="dam-id" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dam-id">
                        <QrCode className="mr-2"/> DAMid
                    </TabsTrigger>
                    <TabsTrigger value="select-user">
                        <Keyboard className="mr-2"/> Select User
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="dam-id" className="space-y-4 pt-4">
                    {isScanning ? (
                        <div className="space-y-4">
                             <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                             <canvas ref={canvasRef} style={{ display: 'none' }} />
                             {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access in your browser settings to use the QR scanner.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full">Cancel</Button>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <Button onClick={() => setIsScanning(true)} className="w-full">
                                <QrCode className="mr-2" /> Scan DAMid QR Code
                            </Button>
                             <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or Enter Manually</span>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <label htmlFor="dam-id-input" className="text-sm font-medium">DAMid</label>
                                <Input id="dam-id-input" type="number" placeholder="Enter your 5-digit DAMid" value={damId} onChange={(e) => { setDamId(e.target.value); setError('');}}/>
                             </div>
                             {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button onClick={() => handleDamIdLogin(damId)} className="w-full" size="lg" disabled={!damId || isLoggingIn}>
                                {isLoggingIn ? <Loader2 className="mr-2 animate-spin" /> : <LogIn className="mr-2" />}
                                {isLoggingIn ? 'Signing In...' : 'Sign In'}
                            </Button>
                         </div>
                    )}

                </TabsContent>
                <TabsContent value="select-user" className="space-y-6 pt-4">
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
                                    <SelectItem key={user.id} value={user.id}>{user.fullName} - {user.appRole}</SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No supervisors or admins available for this company.</div>
                            )}
                        </SelectContent>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button onClick={handleDropdownLogin} className="w-full" size="lg" disabled={!selectedUserId || isLoggingIn}>
                        {isLoggingIn ? <Loader2 className="mr-2 animate-spin" /> : <LogIn className="mr-2" />}
                        {isLoggingIn ? 'Signing In...' : 'Sign In'}
                    </Button>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
    </div>
  );
}
