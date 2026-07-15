import { useUserStore } from "@/lib/store/user-store";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect } from "react";
import { useAsyncOperation } from "./use-supabase-error";

interface UtilizeData {
    total_approved: number;
    threshold: number;
}

export function useUtilizeAndThresholdAmount() {
    const { user } = useUserStore();
    const { loading: isLoading, error, data, execute } = useAsyncOperation<UtilizeData>();
    const orgId = user?.user_metadata?.org_id;

    const fetchAmounts = useCallback(() => {
        if (!orgId) return;

        // Do not auto-retry statement timeouts (57014): each attempt can hold the
        // DB for up to statement_timeout and retries amplify load. User Retry only.
        execute(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .rpc('is_approved_amount_within_threshold')
                .select()
                .single();

            if (error) throw error;
            return data as unknown as UtilizeData;
        });
    }, [orgId, execute]);

    useEffect(() => {
        fetchAmounts();
    }, [fetchAmounts]);

    return {
        utilizeAmount: data?.total_approved || 0,
        thresholdAmount: data?.threshold || 0,
        isLoading,
        error,
        hasLoaded: !!data,
        refetch: fetchAmounts
    };
}