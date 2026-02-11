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
  UserCog,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { User, Settings as AppSettings } from '@/lib/types';
import { signOut } from '@/app/auth/actions';
import { ROLES } from '@/lib/constants';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN], color: 'text-blue-500', bg: 'hover:bg-blue-50' },
  { href: '/clients', label: 'Clients', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.USER], color: 'text-indigo-500', bg: 'hover:bg-indigo-50' },
  { href: '/suppliers', label: 'Fournisseurs', icon: Briefcase, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], color: 'text-amber-500', bg: 'hover:bg-amber-50' },
  { href: '/purchases', label: 'Achats', icon: ShoppingCart, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], color: 'text-emerald-500', bg: 'hover:bg-emerald-50' },
  { href: '/products', label: 'Produits', icon: Box, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER], color: 'text-orange-500', bg: 'hover:bg-orange-50' },
  { href: '/devis', label: 'Proforma', icon: FileClock, roles: [ROLES.SUPER_ADMIN, ROLES.USER], color: 'text-violet-500', bg: 'hover:bg-violet-50' },
  { href: '/client-orders', label: 'Commandes', icon: PackageSearch, roles: [ROLES.SUPER_ADMIN, ROLES.USER], color: 'text-rose-500', bg: 'hover:bg-rose-50' },
  { href: '/invoices', label: 'Factures', icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER], color: 'text-sky-500', bg: 'hover:bg-sky-50' },
  { href: '/settlements', label: 'Règlements', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], color: 'text-lime-500', bg: 'hover:bg-lime-50' },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], color: 'text-red-500', bg: 'hover:bg-red-50' },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: [ROLES.SUPER_ADMIN], color: 'text-cyan-500', bg: 'hover:bg-cyan-50' },
  { href: '/team', label: 'Equipe', icon: UserCog, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], color: 'text-teal-500', bg: 'hover:bg-teal-50' },
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

  const Logo = ({ size = 32 }: { size?: number }) => (
    settings.logoUrl ? (
      <Image src={settings.logoUrl} alt="BizBook Logo" width={size} height={size} className="rounded-md object-contain shrink-0" data-ai-hint="logo" />
    ) : (
      <div className="p-1 rounded-lg bg-primary shadow-sm text-white shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width={size-10} height={size-8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 a4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1 2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
      </div>
    )
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 xl:gap-6 overflow-hidden">
            <Link href="/" className="flex items-center gap-2 group shrink-0 xl:hidden">
              <Logo size={32} />
              <span className="font-black text-lg tracking-tight text-primary">
                BizBook
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-0.5">
              {accessibleNavItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 whitespace-nowrap group/nav",
                      isActive 
                        ? "bg-primary text-white shadow-sm scale-105" 
                        : cn("text-muted-foreground", item.bg, "hover:text-foreground hover:scale-105")
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive ? "text-white" : cn(item.color, "group-hover/nav:scale-110")
                    )} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden hover:bg-primary/10 transition-colors"
                >
                  <Menu className="h-6 w-6 text-primary" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-[300px] p-0">
                <div className="p-6 border-b">
                  <Link
                    href="/"
                    className="flex items-center gap-3 text-2xl font-bold text-primary"
                    onClick={() => setSheetOpen(false)}
                  >
                    <Logo size={40} />
                    <span>BizBook</span>
                  </Link>
                </div>
                <ScrollArea className="flex-1">
                  <nav className="grid gap-1 p-4 text-lg font-medium">
                    {accessibleNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          "flex items-center gap-4 rounded-xl px-4 py-2.5 transition-all",
                          (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-muted-foreground active:bg-primary/5 hover:bg-primary/5"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? "text-white" : item.color)} />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3 shrink-0">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border-2 border-primary/10 hover:border-primary/40 transition-all">
                      <Avatar className="h-full w-full">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl shadow-premium border-primary/5 p-2">
                  <DropdownMenuLabel className="font-normal px-4 py-3">
                      <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{user.role}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate pt-1">
                          {user.email}
                      </p>
                      </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="mx-2" />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer px-4 py-2 hover:bg-primary/5">
                      <Link href="/settings" className="w-full flex items-center gap-2">
                        <Settings className="size-4" />
                        <span>Paramètres</span>
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mx-2" />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive px-4 py-2">
                      <form action={signOut} className="w-full">
                      <button type="submit" className="flex items-center w-full gap-2">
                          <LogOut className="size-4" />
                          <span>Déconnexion</span>
                      </button>
                      </form>
                  </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1800px] p-4 lg:p-8 xl:px-10 xl:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
