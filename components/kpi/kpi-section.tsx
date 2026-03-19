'use client';

import type {
    BenefitsKPI,
    NeedAttentionKPI,
    PaymentSavingsKPI,
    KPIMetric,
} from '@/types/kpi-metrics-type';
import { KPICard } from './kpi-card';
import { MonthPicker } from './month-picker';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, DollarSign, AlertTriangle, LayoutDashboard, FilterX } from 'lucide-react';
import { StationTypeSelector } from '../input/station-type-selector';
import { ZoneIdSelector } from '../input/zone-id-selector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface KPISectionProps {
    orgId?: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Sparkles; description: string }> = {
    benefits: {
        label: 'Time Savings',
        icon: Sparkles,
        description: 'Automation efficiency metrics',
    },
    need_attention: {
        label: 'Needs Review',
        icon: AlertTriangle,
        description: 'Items requiring attention',
    },
    payment_savings: {
        label: 'Payment Savings',
        icon: DollarSign,
        description: 'Financial benefits achieved',
    },
};

const categoryOrder = ['benefits', 'payment_savings', 'need_attention'];
const lagKpiNames = new Set(['Lag Bills', 'Lag Recharges']);

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
    // "Applied" filters drive the KPI query. We keep separate "draft" filters so users can
    // select multiple options without triggering an RPC on every single click.
    const [selectedSiteTypes, setSelectedSiteTypes] = useState<string[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string[]>([]);
    const [draftSelectedSiteTypes, setDraftSelectedSiteTypes] = useState<string[]>([]);
    const [draftSelectedZoneId, setDraftSelectedZoneId] = useState<string[]>([]);
    const getStartDateAndEndDate = (month: Date): { startDate: string, endDate: string } => {
        const today = new Date();
        const startDate = formatDateYYYYMMDD(getMonthStart(month));
        const endDate = formatDateYYYYMMDD(
            isSameMonth(month, today) ? today : getMonthEnd(month)
        );
        return { startDate, endDate };
    };

    const buildKPIMetricsFromFunctions = async (orgId: string, month: Date): Promise<KPIMetric[] | null> => {
        const calculationMonth = formatCalculationMonth(month);
        const { startDate, endDate } = getStartDateAndEndDate(month);
        const nowIso = new Date().toISOString();

        const [benefitsRes, paymentSavingsRes, needAttentionRes] = await Promise.all([
            supabase.rpc('get_benefits_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
                p_site_type_key: selectedSiteTypes.join(','),
                p_zone_id: selectedZoneId.join(','),
            }),
            supabase.rpc('get_payment_savings_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
                p_site_type_key: selectedSiteTypes.join(','),
                p_zone_id: selectedZoneId.join(','),
            }),
            supabase.rpc('get_need_attention_kpis', {
                p_org_id: orgId,
                p_start_date: startDate,
                p_end_date: endDate,
                p_site_type_key: selectedSiteTypes.join(','),
                p_zone_id: selectedZoneId.join(','),
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
    }, [orgId, selectedMonth, selectedSiteTypes, selectedZoneId]);

    const normalizeValues = (values: string[]) =>
        values
            .map((v) => v?.trim())
            .filter((v) => v);

    const areSetsEqual = (a: string[], b: string[]) => {
        const normalizedA = normalizeValues(a);
        const normalizedB = normalizeValues(b);
        if (normalizedA.length !== normalizedB.length) return false;
        const setA = new Set(normalizedA);
        const setB = new Set(normalizedB);
        if (setA.size !== setB.size) return false;
        // Avoid `for...of` directly on `Set` to prevent TS downlevel iteration errors.
        for (const v of Array.from(setA)) {
            if (!setB.has(v)) return false;
        }
        return true;
    };

    const formatZoneOrTypeBadge = (values: string[], pluralSuffix: string) => {
        const normalized = normalizeValues(values);
        if (normalized.length === 0) return `All ${pluralSuffix}`;
        if (normalized.length === 1) return normalized[0];
        return `${normalized.length} ${pluralSuffix}`;
    };

    const hasDraftChanges =
        !areSetsEqual(draftSelectedSiteTypes, selectedSiteTypes) ||
        !areSetsEqual(draftSelectedZoneId, selectedZoneId);

    const canApply = hasDraftChanges && !isLoading;
    const canClearDrafts = draftSelectedSiteTypes.length > 0 || draftSelectedZoneId.length > 0;

    const applyFilters = () => {
        setSelectedSiteTypes(normalizeValues(draftSelectedSiteTypes));
        setSelectedZoneId(normalizeValues(draftSelectedZoneId));
    };

    const clearFilters = () => {
        setDraftSelectedSiteTypes([]);
        setDraftSelectedZoneId([]);
        setSelectedSiteTypes([]);
        setSelectedZoneId([]);
    };

    const handleMonthSelect = async (date: Date) => {
        if (!orgId) {
            console.error('Organization ID not available');
            return;
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const selectedYear = date.getFullYear();
        const selectedMonthNum = date.getMonth();

        if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonthNum > currentMonth)) {
            return;
        }

        setSelectedMonth(date);
    };

    if (isLoading) {
        return (
            <section className="flex items-center justify-center py-16 md:snap-start">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 blur-xl opacity-30 animate-pulse" />
                        <Loader2 className="relative h-10 w-10 animate-spin text-violet-500" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Loading metrics...</p>
                </div>
            </section>
        );
    }

    const isLoadingMetrics = isLoading;

    const calculationMonth = metrics && metrics.length > 0 && metrics[0]?.calculation_month
        ? formatMonth(metrics[0].calculation_month)
        : selectedMonth
            ? formatDateToMonthYear(selectedMonth)
            : 'Current Month';

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

    const lagMetrics =
        groupedMetrics.need_attention?.filter((m) => lagKpiNames.has(m.kpi_name)) ?? [];
    const nonLagNeedAttentionMetrics =
        groupedMetrics.need_attention?.filter((m) => !lagKpiNames.has(m.kpi_name)) ?? [];

    const sortedCategories = categoryOrder.filter(cat => groupedMetrics[cat]?.length > 0)
        .concat(Object.keys(groupedMetrics).filter(cat => !categoryOrder.includes(cat)));

    return (
        <section className="md:snap-start">
            <div className="mx-auto w-full max-w-7xl">
                {/* Month Picker + Filters */}
                <div className="bg-background/80 border-b border-border/50">
                    <div className="flex flex-col items-center py-4 px-4 sm:px-6 lg:px-8 gap-3">
                        <div className="w-full flex items-end justify-center sm:justify-between gap-3 flex-col sm:flex-row">
                            <div className="flex items-center justify-center">
                                <MonthPicker
                                    value={selectedMonth}
                                    onSelect={handleMonthSelect}
                                    placeholder="Select month"
                                    className="bg-white dark:bg-white/5 border-border/50 text-foreground hover:bg-accent/50 hover:border-border shadow-sm"
                                    disabled={isLoadingMetrics}
                                    maxDate={new Date()}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                                <Badge variant="outline" className="whitespace-nowrap">
                                    Showing: {formatZoneOrTypeBadge(selectedZoneId, 'zones')} •{' '}
                                    {formatZoneOrTypeBadge(selectedSiteTypes, 'types')}
                                </Badge>
                                {hasDraftChanges && (
                                    <Badge
                                        variant="secondary"
                                        className="whitespace-nowrap bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                    >
                                        Changes pending
                                    </Badge>
                                )}

                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button type="button" variant="outline" size="sm" className="gap-2">
                                            <FilterX className="h-4 w-4" />
                                            Filters
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="right"
                                        className="w-full sm:w-[520px]"
                                        onOpenAutoFocus={(event) => event.preventDefault()}
                                    >
                                        <div className="space-y-6 py-2">
                                            <div className="space-y-1">
                                                <h2 className="text-lg font-semibold">Filters</h2>
                                                <p className="text-sm text-muted-foreground">
                                                    Refine KPI metrics by zone and station type. Leave empty to include all.
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <Label className="text-xs font-medium text-muted-foreground">Zone ID</Label>
                                                    <ZoneIdSelector
                                                        value={draftSelectedZoneId}
                                                        onChange={(zoneId) => setDraftSelectedZoneId(zoneId)}
                                                        className="min-w-[10rem] min-h-9 rounded-md border border-input bg-background shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <Label className="text-xs font-medium text-muted-foreground">Station type</Label>
                                                    <StationTypeSelector
                                                        value={draftSelectedSiteTypes}
                                                        onChange={(types) => setDraftSelectedSiteTypes(types)}
                                                        className="min-w-[10rem] h-9 rounded-md border border-input bg-background shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                                                <SheetClose asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="flex-1 gap-2"
                                                        onClick={clearFilters}
                                                        disabled={(!canClearDrafts && !hasDraftChanges) || isLoadingMetrics}
                                                    >
                                                        <FilterX className="h-4 w-4" />
                                                        Clear
                                                    </Button>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Button
                                                        type="button"
                                                        className="flex-1"
                                                        onClick={applyFilters}
                                                        disabled={!canApply}
                                                    >
                                                        Apply Filters
                                                    </Button>
                                                </SheetClose>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {(!metrics || metrics.length === 0) && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 blur-2xl" />
                            <div className="relative p-6 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                                <LayoutDashboard className="h-12 w-12 text-violet-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No metrics for {calculationMonth}
                        </h3>
                        {selectedSiteTypes.length > 0 || selectedZoneId.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-muted-foreground text-center max-w-md">
                                    Try clearing your filters, or choose a different month to view KPI metrics.
                                </p>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="px-0"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center max-w-md">
                                Select a different month to view your KPI metrics and performance insights.
                            </p>
                        )}
                    </div>
                )}

                {/* Category-wise Metrics */}
                {(sortedCategories.length > 0 || lagMetrics.length > 0) && (
                    <div className="space-y-12 py-8">
                        {sortedCategories.map((category, categoryIndex) => {
                            const categoryMetrics =
                                category === 'need_attention'
                                    ? nonLagNeedAttentionMetrics
                                    : groupedMetrics[category];
                            if (!categoryMetrics || categoryMetrics.length === 0) return null;

                            const config = categoryConfig[category] || {
                                label: category.replace('_', ' '),
                                icon: Sparkles,
                                description: '',
                            };
                            const CategoryIcon = config.icon;
                                    const categoryAccentByKey: Record<string, string> = {
                                        benefits: 'text-violet-600 dark:text-violet-400',
                                        need_attention: 'text-orange-600 dark:text-orange-400',
                                        payment_savings: 'text-emerald-600 dark:text-emerald-400',
                                        payment: 'text-emerald-600 dark:text-emerald-400',
                                        billing: 'text-blue-600 dark:text-blue-400',
                                    };
                                    const accentClass = categoryAccentByKey[category] ?? 'text-muted-foreground';

                            return (
                                <div
                                    key={category}
                                    className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
                                    style={{ animationDelay: `${categoryIndex * 100}ms` }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-muted/50">
                                                <CategoryIcon className={`h-4 w-4 ${accentClass}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-foreground">
                                                        {config.label}
                                                    </h3>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {categoryMetrics.length}
                                                    </Badge>
                                                </div>
                                                {config.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {config.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-4" />
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {categoryMetrics.map((metric, index) => {
                                            const today = new Date();
                                            const isCurrentMonth = selectedMonth && isSameMonth(selectedMonth, today);
                                            return (
                                                <div
                                                    key={metric.id}
                                                    className="opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]"
                                                    style={{ animationDelay: `${categoryIndex * 100 + index * 75}ms` }}
                                                >
                                                    <KPICard
                                                        metric={metric}
                                                        isCurrentMonth={isCurrentMonth || false}
                                                        {...getStartDateAndEndDate(selectedMonth ?? new Date())}
                                                        orgId={orgId}
                                                        siteTypeKey={selectedSiteTypes.length > 0 ? selectedSiteTypes.join(',') : undefined}
                                                        zoneId={selectedZoneId.length > 0 ? selectedZoneId.join(',') : undefined}
                                                    />
                                                </div>
                                            );
                                        })}
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
