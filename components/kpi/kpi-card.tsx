'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KPIMetric, TrendDirection, Severity } from '@/types/kpi-metrics-type';
import { formatNumber, formatMinutesToTime } from '@/lib/utils/number-format';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Sparkles,
    Receipt,
    CreditCard,
    Zap,
    AlertTriangle,
    Info,
    DollarSign,
    TrendingUp as TrendingUpIcon,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    metric: KPIMetric;
}

interface MetricMetadata {
    benefitDescription?: string;
    severity?: Severity;
    accruedValue?: number;
    potentialValue?: number;
    savingsPercentage?: number;
    bill_fetch_per_min?: number;
    balance_fetch_per_min?: number;
    reading_fetch_per_min?: number;
}

const kpiDisplayNames: Record<string, string> = {
    'Lag Bills': 'Bills Not Fetched (This Month)',
    'Lag Recharges': 'Balances Not Updated (3+ days)',
};

const kpiDescriptions: Record<string, string> = {
    'Lag Bills': 'Latest bill was not fetched for this month\'s bill date.',
    'Lag Recharges': 'No prepaid balance fetch received in the last 3 days.',
};

const categoryIcons = {
    billing: Receipt,
    payment: CreditCard,
    benefits: Sparkles,
    need_attention: AlertTriangle,
    payment_savings: DollarSign,
};

const categoryStyles = {
    billing: {
        gradient: 'from-blue-500/15 via-blue-400/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        iconShadow: 'shadow-lg shadow-blue-500/20',
        border: 'border-blue-100 dark:border-blue-500/20',
        hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-500/40',
        accent: 'text-blue-600 dark:text-blue-400',
        glow: 'group-hover:shadow-blue-500/10',
    },
    payment: {
        gradient: 'from-green-500/15 via-green-400/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
        iconShadow: 'shadow-lg shadow-green-500/20',
        border: 'border-green-100 dark:border-green-500/20',
        hoverBorder: 'hover:border-green-200 dark:hover:border-green-500/40',
        accent: 'text-green-600 dark:text-green-400',
        glow: 'group-hover:shadow-green-500/10',
    },
    benefits: {
        gradient: 'from-violet-500/15 via-purple-400/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
        iconShadow: 'shadow-lg shadow-violet-500/20',
        border: 'border-violet-100 dark:border-violet-500/20',
        hoverBorder: 'hover:border-violet-200 dark:hover:border-violet-500/40',
        accent: 'text-violet-600 dark:text-violet-400',
        glow: 'group-hover:shadow-violet-500/10',
    },
    need_attention: {
        gradient: 'from-orange-500/15 via-amber-400/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
        iconShadow: 'shadow-lg shadow-orange-500/20',
        border: 'border-orange-100 dark:border-orange-500/20',
        hoverBorder: 'hover:border-orange-200 dark:hover:border-orange-500/40',
        accent: 'text-orange-600 dark:text-orange-400',
        glow: 'group-hover:shadow-orange-500/10',
    },
    payment_savings: {
        gradient: 'from-emerald-500/15 via-teal-400/5 to-transparent',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        iconShadow: 'shadow-lg shadow-emerald-500/20',
        border: 'border-emerald-100 dark:border-emerald-500/20',
        hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-500/40',
        accent: 'text-emerald-600 dark:text-emerald-400',
        glow: 'group-hover:shadow-emerald-500/10',
    },
};

const severityColors = {
    HIGH: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
    },
    MEDIUM: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
    },
    LOW: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
    },
};

export function KPICard({ metric }: KPICardProps) {
    const Icon = categoryIcons[metric.kpi_category] || Zap;
    const styles = categoryStyles[metric.kpi_category] || categoryStyles.benefits;
    const metadata = (metric.metadata as MetricMetadata | null) || {};
    const displayName = kpiDisplayNames[metric.kpi_name] ?? metric.kpi_name;
    const description = kpiDescriptions[metric.kpi_name];

    // Calculate time saved for benefits KPIs
    const getTimeSaved = (): string | null => {
        if (metric.kpi_category !== 'benefits') return null;

        let minutes: number | null = null;

        if (metric.kpi_name === 'Bills Generated') {
            minutes = metric.current_value * 120;
        } else if (metric.kpi_name === 'Balance Fetched') {
            minutes = metric.current_value;
        } else if (metric.kpi_name === 'Sub meter readings captured') {
            minutes = metric.current_value;
        }

        return minutes !== null && minutes > 0 ? formatMinutesToTime(minutes) : null;
    };

    const timeSaved = getTimeSaved();

    const formatValue = (value: number, unit: string): string => {
        if (unit === '₹') {
            return '₹' + formatNumber(value);
        }
        if (unit === '%') {
            return `${value.toFixed(1)}%`;
        }
        return formatNumber(value);
    };

    // Check if this metric benefits from a decrease (lower is better)
    const isDecreasePositive = metric.kpi_name === 'Rate per Unit' || metric.kpi_name === 'Total Units';

    const getTrendIcon = (direction: TrendDirection | null) => {
        switch (direction) {
            case 'UP':
                return ArrowUpRight;
            case 'DOWN':
                return ArrowDownRight;
            case 'NEW':
                return Sparkles;
            default:
                return Minus;
        }
    };

    const getTrendColor = (direction: TrendDirection | null, isDecreaseGood: boolean = false) => {
        if (isDecreaseGood) {
            switch (direction) {
                case 'UP':
                    return 'text-red-500 bg-red-50 dark:bg-red-500/10';
                case 'DOWN':
                    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
                case 'NEW':
                    return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
                default:
                    return 'text-gray-500 bg-gray-50 dark:bg-gray-500/10';
            }
        }

        switch (direction) {
            case 'UP':
                return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
            case 'DOWN':
                return 'text-red-500 bg-red-50 dark:bg-red-500/10';
            case 'NEW':
                return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
            default:
                return 'text-gray-500 bg-gray-50 dark:bg-gray-500/10';
        }
    };

    const TrendIcon = getTrendIcon(metric.trend_direction);
    const trendColor = getTrendColor(metric.trend_direction, isDecreasePositive);
    const severityStyle = metadata.severity ? severityColors[metadata.severity] : null;

    // For payment_savings category, show different layout
    const isPaymentSavings = metric.kpi_category === 'payment_savings';
    const showSavingsInfo = isPaymentSavings && (metadata.accruedValue !== undefined || metadata.potentialValue !== undefined);

    return (
        <Card
            className={cn(
                'group relative overflow-hidden border bg-white dark:bg-card transition-all duration-300 ease-out',
                'hover:shadow-xl hover:-translate-y-1',
                styles.border,
                styles.hoverBorder,
                styles.glow
            )}
        >
            {/* Gradient Background */}
            <div
                className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100',
                    styles.gradient
                )}
            />

            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl" />
            <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-tr from-white/20 to-transparent blur-xl" />

            {/* Good/Decrease Indicator */}
            {isDecreasePositive && metric.trend_direction === 'DOWN' && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Good
                    </span>
                </div>
            )}

            <CardContent className="relative p-6 space-y-4">
                {/* Header with Icon and Title */}
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            'p-3 rounded-xl text-white transition-transform duration-300 group-hover:scale-110',
                            styles.iconBg,
                            styles.iconShadow
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-sm font-medium text-muted-foreground leading-tight">
                            {displayName}
                        </h3>
                    </div>
                </div>

                {/* Main Value */}
                <div className="flex items-end justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight text-foreground">
                            {formatValue(metric.current_value, metric.unit)}
                        </span>
                        {metric.unit !== '₹' && metric.unit !== '%' && (
                            <span className="text-sm font-medium text-muted-foreground">{metric.unit}</span>
                        )}
                    </div>

                    {/* Trend Badge */}
                    {metric.trend_percentage !== null && metric.trend_direction !== null && (
                        <div
                            className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                                trendColor
                            )}
                        >
                            <TrendIcon className="h-3.5 w-3.5" />
                            <span>{Math.abs(metric.trend_percentage).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                {/* Last Month Comparison */}
                {metric.last_month_value !== null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Last month</span>
                        <span className="font-semibold text-foreground">
                            {formatValue(metric.last_month_value, metric.unit)}
                        </span>
                    </div>
                )}

                {/* KPI Explanation (for non-technical users) */}
                {description && (
                    <div className="pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Time Saved for Benefits KPIs */}
                {timeSaved && (
                    <div className="pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/10">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <Clock className="h-4 w-4 text-violet-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Time saved</span>
                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                    {timeSaved}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Savings Info */}
                {showSavingsInfo && (
                    <div className="space-y-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-3">
                            {metadata.accruedValue !== undefined && (
                                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <span className="text-xs text-muted-foreground block mb-1">Accrued</span>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatValue(metadata.accruedValue, metric.unit)}
                                    </span>
                                </div>
                            )}
                            {metadata.potentialValue !== undefined && (
                                <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                                    <span className="text-xs text-muted-foreground block mb-1">Potential</span>
                                    <span className="text-lg font-bold text-foreground">
                                        {formatValue(metadata.potentialValue, metric.unit)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {metadata.savingsPercentage !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    {metadata.savingsPercentage.toFixed(1)}% savings achieved
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Benefit Description */}
                {metadata.benefitDescription && (
                    <div className="pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {metadata.benefitDescription}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
