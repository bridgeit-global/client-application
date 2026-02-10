import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ZoneId {
    value: string;
    label: string;
}
export const useZoneId = () => {
    const [zoneIds, setZoneIds] = useState<ZoneId[]>([]);
    useEffect(() => {
        const getZoneIds = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from("org_master")
                .select("value, name")
                .eq("type", "zone_id")
                .eq("org_id", user?.user_metadata?.org_id)

            if (error) {
                console.error(error);
                setZoneIds([]);
                return;
            }
            setZoneIds(data.map((item) => ({ value: item.value, label: item.name })));
        };
        getZoneIds();
    }, []);

    return zoneIds;
}