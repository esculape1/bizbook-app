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

const navItemStyles = [
  // Dashboard - index 0
  "bg-green-500/10 text-green-700 hover:bg-green-500/20 border border-green-500/20",
  // Clients - index 1
  "bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 border border-pink-500/20",
  // Products - index 2
  "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border border-blue-500/20",
  // Devis - index 3
  "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border border-sky-500/20",
  // Invoices - index 4
  "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border border-orange-500/20",
  // Expenses - index 5
  "bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/20",
  // Reports - index 6
  "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border border-teal-500/20",
  // Settings - index 7
  "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20",
];

const activeRingClasses = [
    "ring-green-400",
    "ring-pink-400",
    "ring-blue-400",
    "ring-sky-400",
    "ring-orange-400",
    "ring-red-400",
    "ring-teal-400",
    "ring-indigo-400",
];


export function AppLayout({ children, user }: { children: ReactNode, user: User }) {
  const pathname = usePathname();
  const userRole = user?.role || 'User';

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
              </div>
              <span>BizBook</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item, index) => (
                  item.roles.includes(userRole) && <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                       pathname === item.href && "text-primary bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
                  </div>
                  <span className="sr-only">BizBook</span>
                </Link>
                {navItems.map((item, index) => (
                    item.roles.includes(userRole) && <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        pathname === item.href && "text-primary bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
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
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
