
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, LayoutDashboard, Users, LogOut, FileText, BarChart, Building, Book } from 'lucide-react';
import Logo from './Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const defaultLinks = [
  { href: '/timesheet', label: 'Timesheet Entry', icon: User, roles: ['Crew Supervisor', 'Subcontractor Admin', 'MEI Supervisor'] },
  { href: '/timesheet/my-submissions', label: 'My Crew Dockets', icon: FileText, roles: ['Crew Supervisor', 'MEI Supervisor'] },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { href: '/admin/users', label: 'User Admin', icon: Users, roles: ['Admin', 'Subcontractor Admin'] },
  { href: '/reports', label: 'Reports', icon: BarChart, roles: ['Admin', 'Read Only', 'Crew Supervisor', 'MEI Supervisor', 'Subcontractor Admin'], exact: true },
  { href: '/reports/my-company-submissions', label: 'Company Dockets', icon: Building, roles: ['Subcontractor Admin'] },
  { href: '/reports/my-company-timesheets', label: 'Company Timesheets', icon: FileText, roles: ['Subcontractor Admin']},
  { href: '/reports/all-submissions', label: 'All Crew Dockets', icon: BarChart, roles: ['Admin']},
  { href: '/reports/crew-activity', label: 'Global Crew Activity', icon: Users, roles: ['Admin', 'MEI Supervisor', 'Read Only']},
  { href: '/reports/all-timesheets', label: 'Global Timesheets', icon: Book, roles: ['Admin', 'MEI Supervisor', 'Read Only']},
]

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
             <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Logo />
             </div>
        </header>
    );
  }

  const allLinks = [
      { href: '/timesheet', label: 'Timesheet Entry', icon: User, roles: ['Crew Supervisor', 'Subcontractor Admin', 'MEI Supervisor'] },
      { href: '/timesheet/my-submissions', label: 'My Crew Dockets', icon: FileText, roles: ['Crew Supervisor', 'MEI Supervisor'] },
      { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
      { href: '/admin/users', label: 'User Admin', icon: Users, roles: ['Admin', 'Subcontractor Admin'] },
      { href: '/reports', label: 'Reports', icon: BarChart, roles: ['Admin', 'Read Only', 'Crew Supervisor', 'MEI Supervisor', 'Subcontractor Admin'] },
  ]

  const availableLinks = allLinks.filter(link => user?.appRole && link.roles.includes(user.appRole));

  const isCurrentPage = (linkHref: string) => {
    if (linkHref === '/reports') {
        return pathname.startsWith('/reports');
    }
    return pathname.startsWith(linkHref);
  }


  const renderNavLinks = (isMobile = false) =>
    availableLinks.map((link) => (
      <Link key={link.href} href={link.href} passHref>
        <Button
          variant={isCurrentPage(link.href) ? 'secondary' : 'ghost'}
          className={cn('w-full justify-start', isMobile && 'text-lg py-6')}
        >
          <link.icon className="mr-2 h-5 w-5" />
          {link.label}
        </Button>
      </Link>
    ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
            <Link href="/">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
                {renderNavLinks()}
            </nav>
        </div>
        
        <div className='flex items-center gap-4'>
            <div className="hidden items-center gap-2 md:flex">
                <span className="text-sm font-medium">{user.fullName}</span>
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={logout} variant="outline" size="icon">
                          <LogOut className="h-5 w-5" />
                          <span className="sr-only">Logout</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logout</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left">
                <div className="flex h-full flex-col">
                    <div className="mb-8">
                    <Link href="/">
                        <Logo />
                    </Link>
                    </div>
                    <nav className="flex flex-col gap-4">{renderNavLinks(true)}</nav>
                    <div className="mt-auto flex items-center gap-2 border-t pt-4">
                        <span className="font-medium">{user.fullName}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={logout} variant="outline" size="icon" className="ml-auto">
                                    <LogOut className="h-5 w-5" />
                                    <span className="sr-only">Logout</span>
                                </Button>
                            </TooltipTrigger>
                             <TooltipContent>
                              <p>Logout</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                </SheetContent>
            </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
