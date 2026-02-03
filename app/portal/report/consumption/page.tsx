import Consumption from "./components/Consumption";
import { createClient } from "@/lib/supabase/server";
import { fetchOrganization } from "@/services/organization";
export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { site_name } = await fetchOrganization();
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Consumption Analysis Report
                </h1>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                    Analyze the consumption of the {site_name}
                </p>
            </div>
            <Consumption site_type={user?.user_metadata?.site_type ?? user?.user_metadata?.station_type} />
        </div>
    );
} 