
'use client';

import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { useEffect, useState } from 'react';
import type { User, Settings } from '@/lib/types';
import { redirect } from 'next/navigation';


// This is a new wrapper component to handle all client-side logic
function ClientWrapper({ layoutData }: { layoutData: LayoutData }) {
    if (layoutData.error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Alert variant="destructive" className="m-4 max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de l'application</AlertTitle>
                    <AlertDescription>
                        Impossible de charger les données essentielles de l'application. Veuillez contacter le support.
                        <p className="mt-2 text-xs">Détail : {layoutData.error}</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // If there is no user session, redirect to login page.
    if (!layoutData.user) {
        redirect('/login');
    }

    // If we have a user and settings, render the main app layout and content.
    return (
        <AppLayout user={layoutData.user} settings={layoutData.settings}>
            <DashboardPage />
        </AppLayout>
    );
}

// The main page component is now responsible for fetching data on the server
// and passing it down to the client wrapper.
type LayoutData = {
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
        
        if (!settings) {
            throw new Error("Les paramètres de l'application n'ont pas pu être chargés.");
        }

        data = { user, settings, error: null };
    } catch (error: any) {
        console.error("Failed to fetch initial data for Home page:", error);
        data = { user: null, settings: null, error: error.message || "Une erreur inconnue est survenue." };
    }

    // We pass the server-fetched data as a prop to the client component.
    return <ClientWrapper layoutData={data} />;
}
