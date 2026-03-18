import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { KPISection } from '@/components/kpi/kpi-section';
import { Badge } from '@/components/ui/badge';

export default async function Page() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fullName =
      (user.user_metadata as { full_name?: string } | null)?.full_name ||
      (user.user_metadata as { full_name?: string; name?: string } | null)?.name ||
      user.email ||
      'there';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Hi, {fullName}. Your operational metrics at a glance.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Today: {today}
            </Badge>
          </div>
        </div>
        <KPISection orgId={user?.user_metadata?.org_id} />
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard page:', error);
    notFound();
  }
}
