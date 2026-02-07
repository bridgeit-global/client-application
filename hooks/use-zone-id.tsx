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
                .from("sites")
                .select("zone_id").eq("org_id", user?.user_metadata?.org_id)
                .eq("is_active", true)
                .not("zone_id", "is", null);

            if (error) {
                console.error(error);
                setZoneIds([]);
                return;
            }

            // Group by zone_id: distinct zone_ids, use zone_id as label
            const uniqueByZoneId = Array.from(
                new Map(
                    (data ?? [])
                        .filter((row): row is { zone_id: string } => Boolean(row?.zone_id))
                        .map((row) => [row.zone_id, { value: row.zone_id, label: row.zone_id }])
                ).values()
            );

            setZoneIds(uniqueByZoneId);
        };

        getZoneIds();
    }, []);

    return zoneIds;
}