import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ApiClientsPanel from '@/components/accounts/api-clients-panel';

export default async function ApiClientsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.user_metadata?.role !== 'admin') {
        redirect('/portal/dashboard');
    }

    return (
        <div className="space-y-6">
            <ApiClientsPanel />
        </div>
    );
}
