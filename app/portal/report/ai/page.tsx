import { createClient } from '@/lib/supabase/server';
import { fetchOrganization } from '@/services/organization';
import AIAnalystChat from './components/ai-analyst-chat';

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { site_name } = await fetchOrganization();

  const orgId = (user?.user_metadata as any)?.org_id as string | undefined;

  if (!orgId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          AI Bill Analyst
        </h1>
        <p className="text-sm text-destructive">
          Your account is missing an associated organization. Please contact
          support.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          AI Bill Analyst
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ask questions about bills, penalties, rebates, and anomalies across{' '}
          {site_name}. The analyst uses live data from your portal.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AIAnalystChat orgId={orgId} orgName={site_name} />
      </div>
    </div>
  );
}

