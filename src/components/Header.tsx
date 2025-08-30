
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, LayoutDashboard, Users, LogOut, FileText, BarChart } from 'lucide-react';
import Logo from './Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const defaultLinks = [
  { href: '/timesheet', label: 'Timesheet Entry', icon: User, roles: ['Crew Supervisor', 'Admin', 'Subcontractor Admin'] },
  { href: '/timesheet/my-submissions', label: 'My Submissions', icon: FileText, roles: ['Crew Supervisor'] },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Subcontractor Admin'] },
  { href: '/admin/users', label: 'User Admin', icon: Users, roles: ['Admin', 'Subcontractor Admin'] },
  { href: '/reports', label: 'Reports', icon: BarChart, roles: ['Admin', 'Subcontractor Admin', 'Read Only'] },
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

  const availableLinks = [...defaultLinks, ...adminLinks].filter(link => user?.appRole && link.roles.includes(user.appRole));

  const renderNavLinks = (isMobile = false) =>
    availableLinks.map((link) => (
      <Link key={link.href} href={link.href} passHref>
        <Button
          variant={pathname.startsWith(link.href) ? 'secondary' : 'ghost'}
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
        <Link href="/">
          <Logo />
        </Link>
        <div className='flex items-center gap-4'>
            <nav className="hidden items-center gap-4 md:flex">
            {renderNavLinks()}
            </nav>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium hidden sm:inline">{user.fullName}</span>
                 <Button onClick={logout} variant="outline" size="icon">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                </Button>
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
                </div>
                </SheetContent>
            </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
