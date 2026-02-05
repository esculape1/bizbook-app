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
  CreditCard,
  PackageSearch,
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
import { ROLES } from '@/lib/constants';

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN] },
  { href: '/clients', label: 'Clients', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.USER] },
  { href: '/suppliers', label: 'Fournisseurs', icon: Briefcase, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/purchases', label: 'Achats', icon: ShoppingCart, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/products', label: 'Produits', icon: Box, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/devis', label: 'Proforma', icon: FileClock, roles: [ROLES.SUPER_ADMIN, ROLES.USER] },
  { href: '/client-orders', label: 'Commandes Clients', icon: PackageSearch, roles: [ROLES.SUPER_ADMIN, ROLES.USER] },
  { href: '/invoices', label: 'Factures', icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/settlements', label: 'Règlements', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: [ROLES.SUPER_ADMIN] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: [ROLES.SUPER_ADMIN] },
];

export function AppLayout({ 
  children, 
  user, 
  settings,
}: { 
  children: ReactNode, 
  user: User, 
  settings: AppSettings,
}) {
  const pathname = usePathname();
  const userRole = user?.role || ROLES.USER;
  const [isSheetOpen, setSheetOpen] = useState(false);

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  const Logo = () => (
    settings.logoUrl ? (
      <Image src={settings.logoUrl} alt="BizBook Logo" width={36} height={36} className="rounded-md object-contain" data-ai-hint="logo" />
    ) : (
      <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/20 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
      </div>
    )
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] bg-background">
      <div className="hidden md:block border-r bg-card/50 backdrop-blur-md sticky top-0 h-screen">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight text-primary">
              <Logo />
              <span>BizBook</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="grid items-start px-4 text-sm font-medium gap-1">
              {accessibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 group",
                    (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110",
                    (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? "text-white" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-6 border-t mt-auto">
             <footer className="w-full text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                <p className="mb-1">© {new Date().getFullYear()} BizBook</p>
                <p>DLG Caverne Consortium</p>
             </footer>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 md:h-20 items-center gap-4 border-b bg-card/50 backdrop-blur-md px-4 lg:px-8 sticky top-0 z-30">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-none bg-transparent hover:bg-primary/10"
              >
                <Menu className="h-6 w-6 text-primary" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[300px]">
              <nav className="grid gap-2 text-lg font-medium pt-4">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-2xl font-bold mb-8 text-primary"
                >
                  <Logo />
                  <span>BizBook</span>
                </Link>
                {accessibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl px-4 py-3 transition-all",
                      (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) 
                        ? "bg-primary text-white" 
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
             {/* Espace pour barre de recherche ou titre dynamique si nécessaire */}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
                <p className="text-sm font-bold text-foreground leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{user.role}</p>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all">
                    <Avatar className="h-full w-full">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-premium border-primary/5">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/settings" className="w-full">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
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
        <main className="flex flex-1 flex-col gap-8 p-4 lg:p-8 xl:p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
