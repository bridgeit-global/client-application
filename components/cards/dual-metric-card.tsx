import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Icon from '../icon';
import { formatNumber } from '@/lib/utils/number-format';
import Link from 'next/link';
import { DashboardData } from '@/types/dashboard-type';
import { Separator } from '../ui/separator';

export const colors = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];

export const DualMetricCard = ({ data, title }: { data: DashboardData[], title: string }) => {
    if (!data?.length) return null;

    const [nonEVData, evData] = data;
    const isDisabled = !nonEVData?.status || Number(nonEVData?.value) === 0;

    const getColorByValue = (value: number) => {

        if (title === 'Unit Cost') {
            if (value === 0) return colors[1];
            if (value <= 5) return colors[2];
            if (value <= 10) return colors[3];
            return colors[4];
        }
        if (title === 'Swap Cost') {
            if (value === 0) return colors[1];
            if (value <= 10) return colors[2];
            if (value <= 25) return colors[3];
            return colors[4];
        }
        return colors[0];
    };

    const formatValue = (item: DashboardData) => {
        const value = Number(Number(item.value).toFixed(2));
        const formattedValue = item.value_type === 1
            ? `₹${formatNumber(value)}`
            : formatNumber(value);

        return {
            value: formattedValue,
            color: item.status ? getColorByValue(value) : colors[0]
        };
    };

    return (
        <Link href={`/portal/${nonEVData.path}`} scroll={false}>
            <Card className={isDisabled ? 'bg-muted text-gray-600' : 'hover:bg-yellow-50'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon
                        name={nonEVData.icon || 'Activity'}
                        className="h-4 w-4 text-muted-foreground"
                    />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="text-xs text-muted-foreground">Non-EV</div>
                            <div
                                className="text-2xl font-semibold"
                                style={{ color: formatValue(nonEVData).color }}
                            >
                                {formatValue(nonEVData).value}
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                            <div className="text-xs text-muted-foreground">EV</div>
                            <div
                                className="text-2xl font-semibold"
                                style={{ color: formatValue(evData).color }}
                            >
                                {formatValue(evData).value}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
