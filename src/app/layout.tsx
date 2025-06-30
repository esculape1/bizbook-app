
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

// Force dynamic rendering for the entire app, as it's heavily session-based.
// This resolves issues with `cookies()` being used in the layout.
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        {user ? (
            <AppLayout user={user}>
              {children}
            </AppLayout>
          ) : (
            <>
              {children}
            </>
        )}
        <Toaster />
      </body>
    </html>
  );
}
