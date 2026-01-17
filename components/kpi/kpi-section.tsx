import { KPIMetric } from '@/types/kpi-metrics-type';
import { KPICard } from './kpi-card';
import { Calendar } from 'lucide-react';

interface KPISectionProps {
    metrics: KPIMetric[];
}

const categoryLabels: Record<string, string> = {
    billing: 'Billing Metrics',
    payment: 'Payment Metrics',
    benefits: 'Benefits Metrics',
    need_attention: 'Need Attention',
};

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

export function KPISection({ metrics }: KPISectionProps) {
    if (!metrics || metrics.length === 0) {
        return null;
    }

    // Group metrics by category
    const groupedMetrics = metrics.reduce((acc, metric) => {
        const category = metric.kpi_category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
    }, {} as Record<string, KPIMetric[]>);

    // Get the calculation month from the first metric (all should be the same)
    const calculationMonth = metrics[0]?.calculation_month
        ? formatMonth(metrics[0].calculation_month)
        : 'Current Month';

    return (
        <section className="my-16 flex items-center justify-center py-8 md:snap-start">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl text-white font-bold tracking-tight sm:text-4xl">
                        KPI Dashboard
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-xl text-white/80">
                        Track your key performance indicators at a glance
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
                        <Calendar className="h-4 w-4" />
                        <span>Showing data for <span className="font-semibold text-white/80">{calculationMonth}</span> only</span>
                    </div>
                </div>

                {/* Category-wise Metrics */}
                <div className="space-y-12">
                    {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                        <div key={category}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-white capitalize">
                                    {categoryLabels[category] || category.replace('_', ' ')}
                                </h3>
                                <p className="text-sm text-white/60 mt-1">
                                    {categoryMetrics.length} {categoryMetrics.length === 1 ? 'metric' : 'metrics'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {categoryMetrics.map((metric) => (
                                    <KPICard key={metric.id} metric={metric} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
