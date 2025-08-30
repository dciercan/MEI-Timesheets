
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import AuthWrapper from '@/components/AuthWrapper';


export const metadata: Metadata = {
  title: 'MEI Timesheet',
  description: 'A modern timesheet system for crew supervisors and admins.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Lora:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <AuthProvider>
            <AuthWrapper>
                {children}
            </AuthWrapper>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
