
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
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
  Briefcase,
  ShoppingCart,
  BrainCircuit,
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
import type { User, Settings as AppSettings } from '@/lib/types';
import { signOut } from '@/app/auth/actions';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/clients', label: 'Clients', icon: Users, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/suppliers', label: 'Fournisseurs', icon: Briefcase, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/purchases', label: 'Achats', icon: ShoppingCart, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/products', label: 'Produits', icon: Box, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/devis', label: 'Proforma', icon: FileClock, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/invoices', label: 'Factures', icon: FileText, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: ['SuperAdmin', 'Admin', 'User'] },
  { href: '/analysis', label: 'Analyse', icon: BrainCircuit, roles: ['SuperAdmin', 'Admin'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['SuperAdmin', 'Admin', 'User'] },
];

export function AppLayout({ children, user, settings }: { children: ReactNode, user: User, settings: AppSettings }) {
  const pathname = usePathname();
  const userRole = user?.role || 'User';
  const [isSheetOpen, setSheetOpen] = useState(false);

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));
  
  const currentPageTitle = accessibleNavItems.find(item => {
    // Exact match for the dashboard
    if (item.href === '/') return pathname === '/';
    // For other routes, check if the pathname starts with the href
    return item.href !== '/' && pathname.startsWith(item.href);
  })?.label || '';


  const Logo = () => (
    settings.logoUrl ? (
      <Image src={settings.logoUrl} alt="BizBook Logo" width={32} height={32} className="rounded-sm object-contain" data-ai-hint="logo" />
    ) : (
      <div className="p-2 rounded-lg bg-primary/20 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
      </div>
    )
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 z-50">
        
        {/* Mobile Menu Trigger & Main navigation for desktop */}
        <nav className="flex-1 flex items-center gap-6 text-lg font-medium">
            {/* Desktop Logo & Nav */}
            <div className="hidden md:flex md:items-center md:gap-5 md:text-sm">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg md:text-base">
                <Logo />
                <span className="hidden lg:inline-block">BizBook</span>
                </Link>
                {accessibleNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        "transition-colors hover:text-foreground ml-6",
                        pathname === item.href ? "text-foreground font-semibold" : "text-muted-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setSheetOpen(false)}>
                    <Logo />
                    <span>BizBook</span>
                </Link>
                {accessibleNavItems.map((item) => (
                    <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? "text-primary bg-muted" : "text-muted-foreground"
                    )}
                    >
                        <item.icon className="h-6 w-6" />
                        {item.label}
                    </Link>
                ))}
                </nav>
            </SheetContent>
            </Sheet>
        </nav>
        
        {/* Right Side: Page Title (Desktop) and User Menu */}
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground hidden md:block">{currentPageTitle}</h1>
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
      <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6">
        {children}
      </main>
      <footer className="w-full p-4 text-center text-xs text-muted-foreground bg-background/90 backdrop-blur-sm">
        <p className="mb-2">© {new Date().getFullYear()} BizBook. Conçu et développé par DLG Caverne Consortium.</p>
        <div className="flex flex-col items-center justify-center gap-y-1 sm:flex-row sm:gap-x-2">
            <span>Email: dlgbiomed@gmail.com</span>
            <span className="hidden sm:inline">|</span>
            <span>Tél: +226 25 46 55 12 / +226 70 15 06 99</span>
        </div>
    </footer>
    </div>
  );
}
