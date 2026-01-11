
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getLayoutData() {
    try {
        const [user, settings] = await Promise.all([getSession(), getSettings()]);
        return { user, settings, error: null };
    } catch (error: any) {
        console.error("Erreur critique lors de la récupération des données pour le layout:", error);
        return { user: null, settings: null, error: error.message || "Une erreur inconnue est survenue." };
    }
}

export default async function Home() {
    const { user, settings, error } = await getLayoutData();

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-background">
                <Alert variant="destructive" className="max-w-2xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
                    <AlertDescription>
                        <p>Impossible de charger les données de l'application. Cela est probablement dû au dépassement des limites d'utilisation de votre base de données Firebase.</p>
                        <p className="mt-2 text-xs">Veuillez vérifier votre compte Firebase et passer à un forfait supérieur pour restaurer l'accès.</p>
                        <p className="mt-2 text-xs opacity-70">Détail technique : {error}</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!user) {
        // This should theoretically be handled by middleware, but it's a good fallback.
        return redirect('/login');
    }

    if (!settings) {
         return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-background">
                <Alert variant="destructive" className="max-w-2xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de Configuration</AlertTitle>
                    <AlertDescription>
                        Les paramètres de l'application n'ont pas pu être chargés.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    

    return (
        <AppLayout user={user} settings={settings}>
            <DashboardPage />
        </AppLayout>
    );
}
