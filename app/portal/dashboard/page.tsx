import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { KPISection } from '@/components/kpi/kpi-section';

export default async function Page() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <KPISection orgId={user?.user_metadata?.org_id} />
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard page:', error);
    notFound();
  }
}
