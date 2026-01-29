/**
 * KPI Metrics Type Definitions
 * 
 * Note: After running the migration, regenerate types using:
 * pnpm exec supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
 */

import { Json } from './supabase';

// KPI Metrics Table Types
export type KPIMetricCategory = 'billing' | 'payment' | 'benefits' | 'need_attention' | 'payment_savings';
export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL' | 'NEW';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface KPIMetric {
    id: string;
    org_id: string;
    kpi_name: string;
    kpi_category: KPIMetricCategory;
    current_value: number;
    last_month_value: number | null;
    trend_percentage: number | null;
    trend_direction: TrendDirection | null;
    unit: string;
    calculation_month: string;
    metadata: Json | null;
    created_at: string;
    updated_at: string;
}

// Billing KPI Response
export interface BillingKPI {
    kpi_name: string;
    current_value: number;
    last_month_value: number;
    trend_percentage: number | null;
    trend_direction: TrendDirection;
    unit: string;
}

// Payment KPI Response
export interface PaymentKPI {
    kpi_name: string;
    current_value: number;
    last_month_value: number;
    trend_percentage: number | null;
    trend_direction: TrendDirection;
    unit: string;
}

// Benefits KPI Response
export interface BenefitsKPI {
    kpi_name: string;
    current_value: number;
    last_month_value: number;
    trend_percentage: number | null;
    trend_direction: TrendDirection;
    unit: string;
    benefit_description: string;
}

// Payment Savings KPI Response
export interface PaymentSavingsKPI {
    kpi_name: string;
    potential_value: number;
    accrued_value: number;
    savings_percentage: number;
    unit: string;
}

// Need Attention KPI Response
export interface NeedAttentionKPI {
    kpi_name: string;
    current_value: number;
    unit: string;
    severity: Severity;
}

// All KPIs Response Structure
export interface AllKPIMetrics {
    billing: BillingKPI[];
    payment: PaymentKPI[];
    benefits: BenefitsKPI[];
    paymentSavings: PaymentSavingsKPI[];
    needAttention: NeedAttentionKPI[];
}

// API Response Structure (matching the requirement document)
export interface KPICardData {
    kpiName: string;
    currentValue: number;
    unit: string;
    lastMonthValue?: number;
    trendPercentage?: number | null;
    trendDirection?: TrendDirection;
    benefitDescription?: string;
    severity?: Severity;
    // For payment savings
    potentialValue?: number;
    accruedValue?: number;
    savingsPercentage?: number;
}

// Function Parameters
export interface GetKPIsParams {
    org_id?: string;
    start_date?: string;
    end_date?: string;
}
