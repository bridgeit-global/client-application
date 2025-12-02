import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useAsyncOperation } from "./use-supabase-error";

interface UtilizeData {
    total_approved: number;
    threshold: number;
}

export function useUtilizeAndThresholdAmount() {
    const { user } = useUserStore();
    const { loading: isLoading, data, execute } = useAsyncOperation<UtilizeData>();

    useEffect(() => {
        if (user?.user_metadata?.org_id) {
            execute(async () => {
                const supabase = await createClient();
                const { data, error } = await supabase.rpc('is_approved_amount_within_threshold').select().single();

                if (error) throw error;
                return data as unknown as UtilizeData;
            });
        }
    }, [user?.user_metadata?.org_id, execute]);

    return {
        utilizeAmount: data?.total_approved || 0,
        thresholdAmount: data?.threshold || 0,
        isLoading
    };
}