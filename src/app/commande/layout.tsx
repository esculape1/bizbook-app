
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Portail de Commande - BizBook',
  description: 'Passez votre commande rapidement',
};

// This is a special layout for the public-facing order portal.
// It does not include the main AppLayout (sidebar, header, etc.).
export default function CommandeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="bg-muted/30">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
