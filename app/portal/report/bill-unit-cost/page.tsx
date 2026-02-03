import { createClient } from "@/lib/supabase/server";
import UnitCost from "./components/UnitCost";
import { fetchOrganization } from "@/services/organization";
import MapCard from "@/components/cards/map-card";
import { fetchConnectionCosts } from "@/services/dashboard";
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { site_name } = await fetchOrganization();
  const connectionCostsResponse = await fetchConnectionCosts();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Bill Unit Cost Analysis Report
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
          Analyze the bill unit cost of the {site_name}
        </p>
      </div>
      <UnitCost site_type={user?.user_metadata?.site_type ?? user?.user_metadata?.station_type} />
      <MapCard mapData={connectionCostsResponse} />
    </div>
  );
} 