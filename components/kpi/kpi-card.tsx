'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KPIMetric, TrendDirection } from '@/types/kpi-metrics-type';
import { formatNumber, formatRupees } from '@/lib/utils/number-format';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Sparkles,
    Receipt,
    CreditCard,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    metric: KPIMetric;
}

const categoryIcons = {
    billing: Receipt,
    payment: CreditCard,
    benefits: Sparkles,
    need_attention: Zap,
};

const categoryColors = {
    billing: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        icon: 'text-blue-400',
        accent: 'text-blue-400',
    },
    payment: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        icon: 'text-green-400',
        accent: 'text-green-400',
    },
    benefits: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        icon: 'text-purple-400',
        accent: 'text-purple-400',
    },
    need_attention: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        icon: 'text-orange-400',
        accent: 'text-orange-400',
    },
};

export function KPICard({ metric }: KPICardProps) {
    const Icon = categoryIcons[metric.kpi_category] || Zap;
    const colors = categoryColors[metric.kpi_category] || categoryColors.benefits;

    const formatValue = (value: number, unit: string): string => {
        if (unit === '₹') {
            return formatRupees(value);
        }
        if (unit === '%') {
            return `${value.toFixed(1)}%`;
        }
        return formatNumber(value);
    };

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

    const getTrendColor = (direction: TrendDirection | null) => {
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
    const trendColor = getTrendColor(metric.trend_direction);

    return (
        <Card
            className={cn(
                'relative overflow-hidden bg-white/5 backdrop-blur-sm border transition-all duration-300',
                'hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg',
                colors.border
            )}
        >
            {/* Decorative gradient overlay */}
            <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20', colors.bg)} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', colors.bg)}>
                        <Icon className={cn('h-4 w-4', colors.icon)} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                            {metric.kpi_category}
                        </p>
                        <h3 className="text-sm font-semibold text-white leading-tight">
                            {metric.kpi_name}
                        </h3>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Main Value */}
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                        {formatValue(metric.current_value, metric.unit)}
                    </span>
                    {metric.unit !== '₹' && metric.unit !== '%' && (
                        <span className="text-sm text-white/60">{metric.unit}</span>
                    )}
                </div>

                {/* Trend Indicator */}
                {metric.trend_direction && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className={cn('flex items-center gap-1', trendColor)}>
                            <TrendIcon className="h-4 w-4" />
                            {metric.trend_percentage !== null && !isNaN(metric.trend_percentage) ? (
                                <span className="text-sm font-medium">
                                    {Math.abs(metric.trend_percentage).toFixed(1)}%
                                </span>
                            ) : (
                                <span className="text-xs font-medium">
                                    {metric.trend_direction === 'NEW' ? 'New' :
                                        metric.trend_direction === 'NEUTRAL' ? 'No change' : 'N/A'}
                                </span>
                            )}
                        </div>
                        {metric.last_month_value !== null &&
                            metric.last_month_value !== 0 &&
                            metric.trend_direction !== 'NEW' && (
                                <span className="text-xs text-white/50">
                                    vs {formatValue(metric.last_month_value, metric.unit)} last month
                                </span>
                            )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
