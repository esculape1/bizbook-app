
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/app/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const user = await getSession();
    
    if (!user) {
        return redirect('/login');
    }

    // Redirect users to their specific "home" page based on their role
    switch (user.role) {
      case ROLES.ADMIN:
        return redirect('/purchases');
      case ROLES.USER:
        return redirect('/invoices');
      case ROLES.SUPER_ADMIN:
        // SuperAdmin stays on the dashboard, so we break to continue execution.
        break;
      default:
        // Any other role is invalid and should be logged out.
        return redirect('/login');
    }

    // From here, only SuperAdmins can continue.
    const settings = await getSettings();

    // The check for settings is important. If it fails, something is wrong with the DB connection.
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
    
    return (
        <AppLayout user={user} settings={settings}>
            <DashboardPage />
        </AppLayout>
    );
}
