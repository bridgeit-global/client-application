/**
 * KPI Metrics Service
 * 
 * Service functions to fetch and manage KPI metrics from the database
 */

import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import type {
    AllKPIMetrics,
    BillingKPI,
    PaymentKPI,
    BenefitsKPI,
    PaymentSavingsKPI,
    NeedAttentionKPI,
    GetKPIsParams,
} from '@/types/kpi-metrics-type';

/**
 * Fetch all KPI metrics for the current organization
 */
export const getAllKPIMetrics = cache(async (
    params?: GetKPIsParams
): Promise<AllKPIMetrics | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_all_kpi_metrics', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching all KPI metrics:', error);
            return null;
        }

        return data as AllKPIMetrics;
    } catch (error) {
        console.error('Error in getAllKPIMetrics:', error);
        return null;
    }
});

/**
 * Fetch billing KPIs
 */
export const getBillingKPIs = cache(async (
    params?: GetKPIsParams
): Promise<BillingKPI[] | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_billing_kpis', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching billing KPIs:', error);
            return null;
        }

        return data as BillingKPI[];
    } catch (error) {
        console.error('Error in getBillingKPIs:', error);
        return null;
    }
});

/**
 * Fetch payment KPIs
 */
export const getPaymentKPIs = cache(async (
    params?: GetKPIsParams
): Promise<PaymentKPI[] | null> => {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('get_payment_kpis', {
            p_org_id: params?.org_id || null,
            p_start_date: params?.start_date || null,
            p_end_date: params?.end_date || null,
        });

        if (error) {
            console.error('Error fetching payment KPIs:', error);
            return null;
        }

        return data as PaymentKPI[];
    } catch (error) {
        console.error('Error in getPaymentKPIs:', error);
        return null;
    }
});

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

/**
 * Store KPI metrics for a specific month
 * This is typically called by a scheduled job or admin function
 */
export const storeKPIMetrics = async (
    orgId: string,
    calculationMonth?: string
): Promise<boolean> => {
    const supabase = await createClient();

    try {
        const { error } = await supabase.rpc('store_kpi_metrics', {
            p_org_id: orgId,
            p_calculation_month: calculationMonth || new Date().toISOString().split('T')[0],
        });

        if (error) {
            console.error('Error storing KPI metrics:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in storeKPIMetrics:', error);
        return false;
    }
};

/**
 * Get stored KPI metrics from the kpi_metrics table
 */
export const getStoredKPIMetrics = cache(async (
    orgId: string,
    calculationMonth?: string
) => {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('kpi_metrics')
            .select('*')
            .eq('org_id', orgId)
            .order('kpi_category', { ascending: true })
            .order('kpi_name', { ascending: true });

        if (calculationMonth) {
            query = query.eq('calculation_month', calculationMonth);
        } else {
            // Get latest month
            query = query.order('calculation_month', { ascending: false }).limit(100);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching stored KPI metrics:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getStoredKPIMetrics:', error);
        return null;
    }
});
