'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, LayoutDashboard, Users } from 'lucide-react';
import Logo from './Logo';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Timesheet Entry', icon: User },
  { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Admin', icon: Users },
];

export default function Header() {
  const pathname = usePathname();

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Link key={link.href} href={link.href} passHref>
        <Button
          variant={pathname === link.href ? 'secondary' : 'ghost'}
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

        <nav className="hidden items-center gap-4 md:flex">
          {renderNavLinks()}
        </nav>

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
    </header>
  );
}
