import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import type { User } from '@/lib/types';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BizBook',
  description: 'Gestion commerciale simplifiée',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mockUser: User = {
      id: 'devuser',
      name: 'Développeur',
      email: 'dev@bizbook.app',
  };

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AppLayout user={mockUser}>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
