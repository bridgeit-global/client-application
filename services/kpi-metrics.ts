

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type {
    BenefitsKPI,
    PaymentSavingsKPI,
    NeedAttentionKPI,
    GetKPIsParams,
} from '@/types/kpi-metrics-type';

/**
 * Fetch benefits KPIs
 */
export const getBenefitsKPIs = cache(async (
    params?: GetKPIsParams
): Promise<BenefitsKPI[] | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_benefits_kpis', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching benefits KPIs:', error);
            return null;
        }

        return data as BenefitsKPI[];
    } catch (error) {
        console.error('Error in getBenefitsKPIs:', error);
        return null;
    }
});

/**
 * Fetch payment savings KPIs
 */
export const getPaymentSavingsKPIs = cache(async (
    params?: GetKPIsParams
): Promise<PaymentSavingsKPI[] | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_payment_savings_kpis', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching payment savings KPIs:', error);
            return null;
        }

        return data as PaymentSavingsKPI[];
    } catch (error) {
        console.error('Error in getPaymentSavingsKPIs:', error);
        return null;
    }
});

/**
 * Fetch need attention KPIs
 */
export const getNeedAttentionKPIs = cache(async (
    params?: GetKPIsParams
): Promise<NeedAttentionKPI[] | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_need_attention_kpis', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching need attention KPIs:', error);
            return null;
        }

        return data as NeedAttentionKPI[];
    } catch (error) {
        console.error('Error in getNeedAttentionKPIs:', error);
        return null;
    }
});

