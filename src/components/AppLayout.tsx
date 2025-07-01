
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
  "bg-green-100 text-green-800 hover:bg-green-200/80 border border-green-200",
  // Clients - index 1
  "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border border-chart-2/20",
  // Products - index 2
  "bg-chart-3/10 text-chart-3 hover:bg-chart-3/20 border border-chart-3/20",
  // Devis - index 3
  "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border border-sky-500/20",
  // Invoices - index 4
  "bg-chart-4/10 text-chart-4 hover:bg-chart-4/20 border border-chart-4/20",
  // Expenses - index 5
  "bg-chart-5/10 text-chart-5 hover:bg-chart-5/20 border border-chart-5/20",
  // Reports - index 6
  "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border border-teal-500/20",
  // Settings - index 7
  "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20",
];

const activeRingClasses = [
    "ring-green-400",       // 0
    "ring-chart-2/50",      // 1
    "ring-chart-3/50",      // 2
    "ring-sky-500/50",      // 3
    "ring-chart-4/50",      // 4
    "ring-chart-5/50",      // 5
    "ring-teal-500/50",     // 6
    "ring-indigo-500/50",   // 7
];


export function AppLayout({ children, user }: { children: ReactNode, user: User }) {
  const pathname = usePathname();
  const userRole = user?.role || 'User';

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-3 lg:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base mr-2"
          >
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
            </div>
            <span className="sr-only">BizBook</span>
          </Link>
          {navItems.map((item, index) => (
            item.roles.includes(userRole) && <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                navItemStyles[index],
                pathname === item.href && `ring-2 ring-offset-1 ring-offset-background ${activeRingClasses[index]}`
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
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
          <SheetContent side="left">
            <nav className="grid gap-4 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
              >
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
                </div>
                <span>BizBook</span>
              </Link>
              {navItems.map((item, index) => (
                  item.roles.includes(userRole) && <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-lg px-4 py-2.5 text-base font-medium transition-colors',
                      navItemStyles[index],
                      pathname === item.href && `ring-2 ring-offset-2 ring-offset-background ${activeRingClasses[index]}`
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-initial">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
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
                  <Link href="/settings" className="w-full">Settings</Link>
                </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem>
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
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8">
        {children}
      </main>
    </div>
  );
}
