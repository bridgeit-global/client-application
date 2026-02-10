import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export const useSiteType = () => {
    const [siteType, setSiteType] = useState<{ value: string; label: string }[]>([]);
    useEffect(() => {
        const getSiteType = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('org_master')
                .select('*')
                .eq('type', 'site_type')
                .eq('org_id', user?.user_metadata?.org_id);

            if (error) {
                setSiteType([]);
                return;
            }

            const mapped = (data ?? []).map((item: { value: string; name: string | null }) => ({
                value: item.value,
                label: item.name ?? item.value,
            }));
            setSiteType(mapped);
        };

        getSiteType();
    }, []);

    return siteType;
}