
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/app/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { ROLES } from '@/lib/constants';
import { WelcomePage } from '@/components/WelcomePage';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const user = await getSession();
    
    if (!user) {
        return redirect('/login');
    }

    const settings = await getSettings(user.organizationId);

    if (!settings) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Alert variant="destructive" className="m-4 max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de l'application</AlertTitle>
                    <AlertDescription>
                        Impossible de charger les paramètres essentiels de l'application. Veuillez contacter le support.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const renderContent = () => {
        switch (user.role) {
            case ROLES.SUPER_ADMIN:
                return <DashboardPage />;
            case ROLES.ADMIN:
            case ROLES.USER:
                return <WelcomePage user={user} />;
            default:
                // Any other role is invalid and should be logged out.
                // This is a safeguard, as getSession should ideally handle this.
                redirect('/login');
                return null;
        }
    };
    
    return (
        <AppLayout user={user} settings={settings}>
            {renderContent()}
        </AppLayout>
    );
}
