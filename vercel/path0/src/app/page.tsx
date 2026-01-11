import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import type { User, Settings } from '@/lib/types';
import { redirect } from 'next/navigation';
import ClientPage from './page-client';

export type LayoutData = {
    user: User | null;
    settings: Settings | null;
    error: string | null;
};

export default async function Home() {
    let data: LayoutData;
    try {
        const [user, settings] = await Promise.all([
            getSession(),
            getSettings()
        ]);
        
        if (!user) {
            redirect('/login');
        }

        if (!settings) {
            throw new Error("Les paramètres de l'application n'ont pas pu être chargés.");
        }

        data = { user, settings, error: null };
    } catch (error: any) {
        console.error("Failed to fetch initial data for Home page:", error);
        data = { user: null, settings: null, error: error.message || "Une erreur inconnue est survenue." };
    }

    if (data.error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Alert variant="destructive" className="m-4 max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de l'application</AlertTitle>
                    <AlertDescription>
                        Impossible de charger les données essentielles de l'application. Veuillez contacter le support.
                        <p className="mt-2 text-xs">Détail : {data.error}</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // We pass the server-fetched data as a prop to the client component.
    return <ClientPage layoutData={data} />;
}
