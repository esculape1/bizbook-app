
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/data';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import AnalysisClientPage from './AnalysisClientPage';
import { PageHeader } from '@/components/PageHeader';

// This is now a pure Server Component.
export default async function AnalysisPage() {
    const [user, settings] = await Promise.all([
      getSession(),
      getSettings()
    ]);

    // If user is not authenticated or settings are missing, redirect to login.
    if (!user || !settings) {
        redirect('/login');
    }
    
    // Render the AppLayout and pass the client component as a child.
    // User and settings data are securely fetched here and passed down.
    return (
        <AppLayout user={user} settings={settings} pageHeader={<PageHeader title="Analyse IA" />}>
            <AnalysisClientPage />
        </AppLayout>
    );
}
