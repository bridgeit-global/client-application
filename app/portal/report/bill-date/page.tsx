import { BillDateAnalysisReport } from './components/BillDateAnalysisReport';
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Bill Date Analysis Report
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
          Analyze the time differences between bill dates, fetch dates, and due dates
        </p>
      </div>
      <BillDateAnalysisReport site_type={user?.user_metadata?.site_type ?? user?.user_metadata?.station_type} />
    </div>
  );
} 