'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

const categoryIcons = {
    billing: Receipt,
    payment: CreditCard,
    benefits: Sparkles,
    need_attention: AlertTriangle,
    payment_savings: DollarSign,
};

const categoryColors = {
    billing: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        icon: 'text-blue-400',
        accent: 'text-blue-400',
        hover: 'hover:border-blue-500/40 hover:bg-primary/10',
    },
    payment: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        icon: 'text-green-400',
        accent: 'text-green-400',
        hover: 'hover:border-green-500/40 hover:bg-primary/10',
    },
    benefits: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        icon: 'text-purple-400',
        accent: 'text-purple-400',
        hover: 'hover:border-purple-500/40 hover:bg-primary/10',
    },
    need_attention: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        icon: 'text-orange-400',
        accent: 'text-orange-400',
        hover: 'hover:border-orange-500/40 hover:bg-primary/10',
    },
    payment_savings: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: 'text-emerald-400',
        accent: 'text-emerald-400',
        hover: 'hover:border-emerald-500/40 hover:bg-primary/10',
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
    const colors = categoryColors[metric.kpi_category] || categoryColors.benefits;
    const metadata = (metric.metadata as MetricMetadata | null) || {};

    // Calculate time saved for benefits KPIs
    const getTimeSaved = (): string | null => {
        if (metric.kpi_category !== 'benefits') return null;

        let minutes: number | null = null;

        if (metric.kpi_name === 'Bills Generated') {
            // bill_fetch_per_min = current_value * 120
            minutes = metric.current_value * 120;
        } else if (metric.kpi_name === 'Balance Fetched') {
            // balance_fetch_per_min = current_value
            minutes = metric.current_value;
        } else if (metric.kpi_name === 'Sub meter readings captured') {
            // reading_fetch_per_min = current_value
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
                return TrendingUp;
            case 'DOWN':
                return TrendingDown;
            case 'NEW':
                return Sparkles;
            default:
                return Minus;
        }
    };

    const getTrendColor = (direction: TrendDirection | null, isDecreaseGood: boolean = false) => {
        // For metrics where decrease is positive, invert the colors
        if (isDecreaseGood) {
            switch (direction) {
                case 'UP':
                    return 'text-red-400'; // Increase is bad
                case 'DOWN':
                    return 'text-green-400'; // Decrease is good
                case 'NEW':
                    return 'text-blue-400';
                default:
                    return 'text-gray-400';
            }
        }

        // Default behavior: increase is good, decrease is bad
        switch (direction) {
            case 'UP':
                return 'text-green-400';
            case 'DOWN':
                return 'text-red-400';
            case 'NEW':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
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
                'relative overflow-hidden border bg-card text-card-foreground transition-all duration-300',
                colors.border,
                colors.hover
            )}
        >
            {isDecreasePositive && metric.trend_direction === 'DOWN' && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Good</span>
                </div>
            )}
            {/* Decorative gradient overlay */}
            <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20 blur-xl', colors.bg)} />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('p-2.5 rounded-lg shrink-0', colors.bg)}>
                        <Icon className={cn('h-5 w-5', colors.icon)} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            {metric.kpi_category.replace('_', ' ')}
                        </p>
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                            {metric.kpi_name}
                        </h3>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Main Value */}
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-bold text-foreground">
                        {formatValue(metric.current_value, metric.unit)}
                    </span>
                    {metric.unit !== '₹' && metric.unit !== '%' && (
                        <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    )}
                </div>


                {/* Time Saved for Benefits KPIs */}
                {timeSaved && (
                    <div className="pt-2 border-t border-border/60 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-400 shrink-0" />
                            <span className="text-sm font-medium text-purple-400">
                                Time saved: {timeSaved}
                            </span>
                        </div>
                    </div>
                )}

                {/* Payment Savings Info */}
                {showSavingsInfo && (
                    <div className="space-y-2 pt-2 border-t border-border/60 dark:border-white/10">
                        {metadata.accruedValue !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Accrued</span>
                                <span className="font-semibold text-emerald-400">
                                    {formatValue(metadata.accruedValue, metric.unit)}
                                </span>
                            </div>
                        )}
                        {metadata.potentialValue !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Potential</span>
                                <span className="font-semibold text-foreground">
                                    {formatValue(metadata.potentialValue, metric.unit)}
                                </span>
                            </div>
                        )}
                        {metadata.savingsPercentage !== undefined && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60 dark:border-white/10">
                                <TrendingUpIcon className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">
                                    {metadata.savingsPercentage.toFixed(1)}% savings
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Benefit Description */}
                {metadata.benefitDescription && (
                    <div className="pt-2 border-t border-border/60 dark:border-white/10">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
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
