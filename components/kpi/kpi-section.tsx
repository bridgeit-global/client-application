'use client';

import { KPIMetric } from '@/types/kpi-metrics-type';
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
    billing: 'Billing Metrics',
    payment: 'Payment Metrics',
    benefits: 'Benefits Metrics',
    need_attention: 'Need Attention',
    payment_savings: 'Payment Savings',
};

const categoryOrder = ['benefits', 'billing', 'payment', 'payment_savings', 'need_attention'];

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
    const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(orgId);
    const [metrics, setMetrics] = useState<KPIMetric[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // Get orgId from user if not provided
    useEffect(() => {
        const fetchOrgId = async () => {
            if (!currentOrgId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.org_id) {
                    setCurrentOrgId(user.user_metadata.org_id);
                }
            }
        };
        fetchOrgId();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrgId]);

    /**
     * Fetches KPI metrics for the current organization and selected month
     * Returns the fetched data or null if there was an error
     */
    const fetchKPIMetrics = async (orgId: string, month: Date): Promise<KPIMetric[] | null> => {
        const calculationMonth = formatCalculationMonth(month);

        try {
            const { data, error } = await supabase
                .from('kpi_metrics')
                .select('*')
                .eq('org_id', orgId)
                .eq('calculation_month', calculationMonth)
                .order('kpi_category', { ascending: true })
                .order('kpi_name', { ascending: true })
                .order('calculation_month', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching stored KPI metrics:', error);
                setMetrics(null);
                return null;
            }

            const metricsData = (data as KPIMetric[]) || [];
            setMetrics(metricsData);
            return metricsData;
        } catch (error) {
            console.error('Error in fetchKPIMetrics:', error);
            setMetrics(null);
            return null;
        }
    };

    // Fetch KPI metrics when orgId or selectedMonth changes
    useEffect(() => {
        const loadMetrics = async () => {
            if (!currentOrgId || !selectedMonth) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            await fetchKPIMetrics(currentOrgId, selectedMonth);
            setIsLoading(false);
        };

        loadMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrgId, selectedMonth]);

    const handleMonthSelect = async (date: Date) => {
        if (!currentOrgId) {
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                            Showing data for
                        </span>
                    </div>
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
