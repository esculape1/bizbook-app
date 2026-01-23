
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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/clients', label: 'Clients', icon: Users, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/suppliers', label: 'Fournisseurs', icon: Briefcase, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/purchases', label: 'Achats', icon: ShoppingCart, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/products', label: 'Produits', icon: Box, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/devis', label: 'Proforma', icon: FileClock, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/client-orders', label: 'Commandes Clients', icon: PackageSearch, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/invoices', label: 'Factures', icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/settlements', label: 'Règlements', icon: CreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER] },
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
      <Image src={settings.logoUrl} alt="BizBook Logo" width={32} height={32} className="rounded-sm object-contain" data-ai-hint="logo" />
    ) : (
      <div className="p-2 rounded-lg bg-primary/20 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M2 9.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"/><path d="M12.5 4H15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5"/><path d="m14 6-2.5 2.5"/><path d="m18 10-6 6"/></svg>
      </div>
    )
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-4 lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo />
              <span className="">BizBook</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {accessibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? "bg-muted text-primary" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
             <footer className="w-full text-center text-xs text-muted-foreground">
                <p className="mb-2">© {new Date().getFullYear()} BizBook.</p>
                <p>By DLG Caverne Consortium</p>
             </footer>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
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
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo />
                  <span >BizBook</span>
                </Link>
                {accessibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                      (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? "bg-muted text-foreground" : ""
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
             {/* Le titre a été enlevé pour un design plus épuré */}
          </div>
          
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
              <DropdownMenuItem asChild>
                <Link href="/settings">Paramètres</Link>
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
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6 min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
