import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { getSession } from '@/lib/session';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BizBook',
  description: 'Gestion commerciale simplifiée',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  // For public pages like login/signup, we don't need the AppLayout
  if (!user) {
    return (
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head />
        <body className="font-body antialiased" suppressHydrationWarning={true}>
          {children}
          <Toaster />
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AppLayout user={user}>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
