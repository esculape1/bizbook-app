'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Box,
  FileText,
  Settings,
  Menu,
  BarChart3,
  Wallet,
  LogOut,
  FileClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { signOut } from '@/app/auth/actions';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'User'] },
  { href: '/clients', label: 'Clients', icon: Users, roles: ['Admin', 'User'] },
  { href: '/products', label: 'Produits', icon: Box, roles: ['Admin', 'User'] },
  { href: '/devis', label: 'Devis', icon: FileClock, roles: ['Admin', 'User'] },
  { href: '/invoices', label: 'Factures', icon: FileText, roles: ['Admin', 'User'] },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, roles: ['Admin', 'User'] },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: ['Admin', 'User'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['Admin', 'User'] },
];

export function AppLayout({ children, user }: { children: ReactNode, user: User }) {
  const pathname = usePathname();
  const userRole = user?.role || 'User';

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 z-50">
        
        {/* Left Side: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
                    </div>
                    <span>BizBook</span>
                  </Link>
                  {accessibleNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        pathname === item.href ? "text-primary bg-muted" : "text-muted-foreground"
                      )}
                    >
                        <item.icon className="h-6 w-6" />
                        {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="hidden items-center gap-2 text-lg font-semibold md:flex">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
              </div>
              <span className="hidden lg:flex">BizBook</span>
            </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {accessibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-background hover:text-foreground",
                  pathname === item.href ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right Side: User Profile */}
        <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground pt-1 font-semibold">
                        Rôle: {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => alert('Fonctionnalité à venir.')}>Profile</DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Déconnexion</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
        {children}
      </main>
    </div>
  );
}
