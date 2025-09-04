
import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'BizBook',
  description: 'Gestion commerciale simplifiée',
};

async function getLayoutData() {
    try {
        const [user, settings] = await Promise.all([getSession(), getSettings()]);
        return { user, settings, error: null };
    } catch (error: any) {
        console.error("Erreur critique lors de la récupération des données pour le layout:", error);
        // This will be caught and displayed to the user
        return { user: null, settings: null, error: error.message || "Une erreur inconnue est survenue." };
    }
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, settings, error } = await getLayoutData();

  if (error || (user && !settings)) {
      return (
          <html lang="fr" className={inter.variable} suppressHydrationWarning>
              <body className="font-body antialiased flex items-center justify-center min-h-screen p-4 bg-background">
                  <Alert variant="destructive" className="max-w-2xl">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
                      <AlertDescription>
                          <p>Impossible de charger les données de l'application. Cela est probablement dû au dépassement des limites d'utilisation de votre base de données Firebase.</p>
                          <p className="mt-2 text-xs">Veuillez vérifier votre compte Firebase et passer à un forfait supérieur pour restaurer l'accès.</p>
                           <p className="mt-2 text-xs opacity-70">Détail technique : {error}</p>
                      </AlertDescription>
                  </Alert>
              </body>
          </html>
      )
  }

  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        {user && settings ? (
            <AppLayout user={user} settings={settings}>
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
