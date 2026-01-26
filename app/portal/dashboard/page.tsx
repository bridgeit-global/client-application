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
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold">
          Welcome {user?.user_metadata?.first_name ?? ''} {user?.user_metadata?.last_name ?? ''}
        </h1>
        <div className="text-xs text-muted-foreground text-right">
          Updated every 1 hour
        </div>
        <KPISection orgId={user?.user_metadata?.org_id} />
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard page:', error);
    notFound();
  }
}
