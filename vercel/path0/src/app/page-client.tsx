'use client';

import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/components/dashboard/DashboardPage';
import type { LayoutData } from './page';

export default function ClientPage({ layoutData }: { layoutData: LayoutData }) {
    if (!layoutData.user || !layoutData.settings) {
        // This case should be handled by the server component redirecting or showing an error,
        // but as a fallback, we can show a loading or minimal state.
        return null; 
    }

    return (
        <AppLayout user={layoutData.user} settings={layoutData.settings}>
            <DashboardPage />
        </AppLayout>
    );
}
