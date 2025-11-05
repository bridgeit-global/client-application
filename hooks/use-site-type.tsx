import { createClient } from "@/lib/supabase/client";
import { SITE_TYPES } from "@/constants/site";
import { useEffect, useState } from "react";

export const useSiteType = () => {
    const [siteType, setSiteType] = useState<any[]>(SITE_TYPES);
    useEffect(() => {
        const getSiteType = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('org_master')
                .select('*')
                .eq('type', 'site_type')
                .eq('org_id', user?.user_metadata?.org_id)
            if (error) {
                console.error(error);
                return SITE_TYPES;
            }


            console.log('data', data)
            const siteType = data?.map((item: any) => {
                return {
                    value: item.value,
                    label: item.name
                }
            })

            if (siteType.length === 0) {
                setSiteType(SITE_TYPES);
                return;
            }

            setSiteType(siteType);
        }

        getSiteType();
    }, []);

    return siteType;
}