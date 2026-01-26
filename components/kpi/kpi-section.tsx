'use client';

import type {
    BenefitsKPI,
    NeedAttentionKPI,
    PaymentSavingsKPI,
    KPIMetric,
} from '@/types/kpi-metrics-type';
import { KPICard } from './kpi-card';
import { Calendar } from 'lucide-react';
import { MonthPicker } from './month-picker';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface KPISectionProps {
    orgId?: string;
}

const categoryLabels: Record<string, string> = {
    benefits: 'Benefits Metrics',
    need_attention: 'Need Attention',
    payment_savings: 'Payment Savings',
};

const categoryOrder = ['benefits', 'payment_savings', 'need_attention'];

const formatMonth = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
};

/**
 * Formats a Date object to YYYY-MM-01 format (first day of the month)
 */
const formatCalculationMonth = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
};

const formatDateYYYYMMDD = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`;
};

const getMonthStart = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const getMonthEnd = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const isSameMonth = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/**
 * Formats a Date object to a readable month/year string
 */
const formatDateToMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
};

export function KPISection({ orgId }: KPISectionProps) {
    const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
    const [metrics, setMetrics] = useState<KPIMetric[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const buildKPIMetricsFromFunctions = async (orgId: string, month: Date): Promise<KPIMetric[] | null> => {
        const today = new Date();
        const calculationMonth = formatCalculationMonth(month);
        const startDate = formatDateYYYYMMDD(getMonthStart(month));
        const endDate = formatDateYYYYMMDD(
            isSameMonth(month, today) ? today : getMonthEnd(month)
        );
        const nowIso = new Date().toISOString();

        const [benefitsRes, paymentSavingsRes, needAttentionRes] = await Promise.all([
            supabase.rpc('get_benefits_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
            }),
            supabase.rpc('get_payment_savings_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
            }),
            supabase.rpc('get_need_attention_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
            }),
        ]);

        if (benefitsRes.error || paymentSavingsRes.error || needAttentionRes.error) {
            console.error('Error fetching live KPI metrics via RPC:', {
                benefits: benefitsRes.error,
                paymentSavings: paymentSavingsRes.error,
                needAttention: needAttentionRes.error,
            });
            return null;
        }

        const benefits = (benefitsRes.data as BenefitsKPI[]) || [];
        const paymentSavings = (paymentSavingsRes.data as PaymentSavingsKPI[]) || [];
        const needAttention = (needAttentionRes.data as NeedAttentionKPI[]) || [];

        const mapped: KPIMetric[] = [
            ...benefits.map((kpi) => ({
                id: `live-benefits-${kpi.kpi_name}`,
                org_id: orgId,
                kpi_name: kpi.kpi_name,
                kpi_category: 'benefits' as const,
                current_value: Number(kpi.current_value),
                last_month_value: kpi.last_month_value ?? null,
                trend_percentage: kpi.trend_percentage ?? null,
                trend_direction: kpi.trend_direction ?? null,
                unit: kpi.unit,
                calculation_month: calculationMonth,
                metadata: {
                    benefitDescription: kpi.benefit_description,
                    ...(kpi.kpi_name === 'Bills Generated'
                        ? { bill_fetch_per_min: Number(kpi.current_value) * 120 }
                        : kpi.kpi_name === 'Balance Fetched'
                            ? { balance_fetch_per_min: Number(kpi.current_value) }
                            : kpi.kpi_name === 'Sub meter readings captured'
                                ? { reading_fetch_per_min: Number(kpi.current_value) }
                                : {}),
                },
                created_at: nowIso,
                updated_at: nowIso,
            })),
            ...paymentSavings.map((kpi) => ({
                id: `live-payment_savings-${kpi.kpi_name}`,
                org_id: orgId,
                kpi_name: kpi.kpi_name,
                kpi_category: 'payment_savings' as const,
                current_value: Number(kpi.accrued_value),
                last_month_value: null,
                trend_percentage: null,
                trend_direction: null,
                unit: kpi.unit,
                calculation_month: calculationMonth,
                metadata: {
                    potentialValue: Number(kpi.potential_value),
                    accruedValue: Number(kpi.accrued_value),
                    savingsPercentage: Number(kpi.savings_percentage),
                },
                created_at: nowIso,
                updated_at: nowIso,
            })),
            ...needAttention.map((kpi) => ({
                id: `live-need_attention-${kpi.kpi_name}`,
                org_id: orgId,
                kpi_name: kpi.kpi_name,
                kpi_category: 'need_attention' as const,
                current_value: Number(kpi.current_value),
                last_month_value: null,
                trend_percentage: null,
                trend_direction: null,
                unit: kpi.unit,
                calculation_month: calculationMonth,
                metadata: { severity: kpi.severity },
                created_at: nowIso,
                updated_at: nowIso,
            })),
        ];

        return mapped;
    };

    // Fetch KPI metrics when orgId or selectedMonth changes
    useEffect(() => {
        const loadMetrics = async () => {
            if (!orgId || !selectedMonth) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await buildKPIMetricsFromFunctions(orgId, selectedMonth);
                setMetrics(data);
            } catch (error) {
                console.error('Error loading KPI metrics:', error);
                setMetrics(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, selectedMonth]);

    const handleMonthSelect = async (date: Date) => {
        if (!orgId) {
            console.error('Organization ID not available');
            return;
        }

        // Prevent selecting a month greater than the current month
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const selectedYear = date.getFullYear();
        const selectedMonth = date.getMonth();

        if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
            // Don't allow selection beyond current month
            return;
        }

        // Update selected month which will trigger the fetch effect
        setSelectedMonth(date);
    };

    if (isLoading) {
        return (
            <section className="my-16 flex items-center justify-center py-8 md:snap-start">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </section>
        );
    }

    const isLoadingMetrics = isLoading;

    // Get the calculation month display text
    // Prefer the month from metrics if available, otherwise use selectedMonth
    const calculationMonth = metrics && metrics.length > 0 && metrics[0]?.calculation_month
        ? formatMonth(metrics[0].calculation_month)
        : selectedMonth
            ? formatDateToMonthYear(selectedMonth)
            : 'Current Month';

    // Group metrics by category (only if metrics exist)
    const groupedMetrics = metrics && metrics.length > 0
        ? metrics.reduce((acc, metric) => {
            const category = metric.kpi_category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(metric);
            return acc;
        }, {} as Record<string, KPIMetric[]>)
        : {};

    // Sort categories by predefined order
    const sortedCategories = categoryOrder.filter(cat => groupedMetrics[cat]?.length > 0)
        .concat(Object.keys(groupedMetrics).filter(cat => !categoryOrder.includes(cat)));

    return (
        <section className="flex items-center justify-center md:snap-start">
            <div className="mx-auto w-full">
                <div className="flex items-center justify-center gap-4 flex-wrap">

                    <div className="flex items-center gap-2">
                        <MonthPicker
                            value={selectedMonth}
                            onSelect={handleMonthSelect}
                            placeholder="Select month"
                            className="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20"
                            disabled={isLoadingMetrics}
                            maxDate={new Date()}
                        />
                    </div>
                </div>

                {/* Show message if no metrics */}
                {(!metrics || metrics.length === 0) && !isLoading && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">
                            No KPI metrics available for {calculationMonth}.
                        </p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Select a month above to view metrics.
                        </p>
                    </div>
                )}

                {/* Category-wise Metrics */}
                {sortedCategories.length > 0 && (
                    <div className="space-y-16">
                        {sortedCategories.map((category) => {
                            const categoryMetrics = groupedMetrics[category];
                            if (!categoryMetrics || categoryMetrics.length === 0) return null;

                            return (
                                <div key={category} className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-semibold text-foreground">
                                                {categoryLabels[category] || category.replace('_', ' ')}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {categoryMetrics.length} {categoryMetrics.length === 1 ? 'metric' : 'metrics'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${categoryMetrics.length.toString()} gap-6`}>
                                        {categoryMetrics.map((metric, index) => (
                                            <div
                                                key={metric.id}
                                                className="opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <KPICard metric={metric} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
