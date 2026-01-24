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
        console.log('🔄 useEffect triggered in useUtilizeAndThresholdAmount');
        console.log('👤 User object:', user);
        console.log('🏢 org_id:', user?.user_metadata?.org_id);
        
        if (user?.user_metadata?.org_id) {
            console.log('✅ org_id found, executing RPC call...');
            execute(async () => {
                const supabase = createClient();
                const { data, error } = await supabase.rpc('is_approved_amount_within_threshold').select().single();

                console.log('📊 is_approved_amount data:', data)
                console.log('❌ is_approved_amount error:', error)

                if (error) throw error;
                return data as unknown as UtilizeData;
            });
        } else {
            console.log('⚠️ No org_id found, skipping RPC call');
        }
    }, [user?.user_metadata?.org_id]);

    return {
        utilizeAmount: data?.total_approved || 0,
        thresholdAmount: data?.threshold || 0,
        isLoading
    };
}