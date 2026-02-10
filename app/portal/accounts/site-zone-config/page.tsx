import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SiteZoneConfigPanel from '@/components/accounts/site-zone-config-panel';

export default async function SiteZoneConfigPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.user_metadata?.role !== 'admin') {
        redirect('/portal/dashboard');
    }

    return (
        <div className="space-y-6">
            <SiteZoneConfigPanel />
        </div>
    );
}
