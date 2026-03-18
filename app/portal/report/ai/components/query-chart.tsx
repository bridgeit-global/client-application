'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChevronDown, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { exportToExcel } from '@/lib/utils';

type Row = Record<string, unknown>;

type ChartType = 'bar' | 'line' | 'pie';

function isNumeric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function tryParseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function tryParseDate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value as any).getTime();
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function getFirstNonNullValue(rows: Row[], key: string): unknown {
  for (const r of rows) {
    const v = r[key];
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

function detectChartType(rows: Row[]): {
  type: ChartType;
  labelKey: string;
  dateKey?: string;
  metricKeys: string[];
} | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const keys = Object.keys(rows[0] ?? {}).filter((k) => k !== 'id');
  if (!keys.length) return null;

  const numericKeys: string[] = [];
  const dateKeys: string[] = [];
  const labelKeys: string[] = [];

  for (const key of keys) {
    const sample = getFirstNonNullValue(rows, key);
    const numeric = tryParseNumber(sample) !== null;
    const date = tryParseDate(sample) !== null;

    if (numeric && !date) {
      numericKeys.push(key);
    } else if (date) {
      dateKeys.push(key);
    } else {
      labelKeys.push(key);
    }
  }

  const rowCount = rows.length;
  const numeric = numericKeys;
  const dates = dateKeys;
  const labels = labelKeys;

  // Line chart: date + 1-2 numeric series.
  if (dates.length >= 1 && numeric.length >= 1 && numeric.length <= 2) {
    return { type: 'line', labelKey: 'label', dateKey: dates[0], metricKeys: numeric.slice(0, 2) };
  }

  // Bar chart: 1 label + 1-3 numeric series for small-ish result sets.
  if (rowCount <= 15 && labels.length >= 1 && numeric.length >= 1) {
    if (numeric.length >= 1 && numeric.length <= 3) {
      return { type: 'bar', labelKey: labels[0], metricKeys: numeric.slice(0, 3) };
    }
  }

  // Pie chart: 1 label + 1 numeric series, small result set.
  if (rowCount <= 8 && labels.length >= 1 && numeric.length === 1) {
    return { type: 'pie', labelKey: labels[0], metricKeys: numeric.slice(0, 1) };
  }

  return null;
}

function formatLabel(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export default function QueryChart({ rows }: { rows: Row[] }) {
  const [expanded, setExpanded] = React.useState(false);

  const chartConfig = React.useMemo(() => detectChartType(rows), [rows]);
  const chartType = chartConfig?.type;

  const title = React.useMemo(() => {
    if (!chartType || !chartConfig) return 'Chart';
    const metricNames = chartConfig.metricKeys.join(', ');
    if (chartType === 'line') return `Trend: ${metricNames}`;
    if (chartType === 'pie') return `Breakdown: ${metricNames}`;
    return `Comparison: ${metricNames}`;
  }, [chartType, chartConfig]);

  const chartData = React.useMemo(() => {
    if (!chartConfig) return [];

    const { type, labelKey, dateKey, metricKeys } = chartConfig;

    // Map metric keys to stable internal keys so we can safely generate CSS vars.
    const metricInternalKeys = metricKeys.map((_, idx) => `metric${idx + 1}`);

    if (type === 'line' && dateKey) {
      const xKey = 'label';
      const seriesKeys = metricInternalKeys;

      const mapped = rows
        .map((r) => {
          const t = tryParseDate(r[dateKey]);
          if (t === null) return null;

          const obj: Record<string, unknown> = {
            [xKey]: new Date(t).toISOString().slice(0, 10)
          };

          metricKeys.forEach((mk, i) => {
            const n = tryParseNumber(r[mk]);
            if (n !== null) obj[seriesKeys[i]] = n;
          });

          return obj;
        })
        .filter(Boolean) as Record<string, unknown>[];

      mapped.sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey])));
      return mapped as Array<Record<string, number | string>>;
    }

    // For bar/pie, aggregate by labelKey to keep charts readable.
    const grouped = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const label = formatLabel(r[labelKey]);
      if (!label) continue;
      if (!grouped.has(label)) {
        const init: Record<string, number> = {};
        metricInternalKeys.forEach((ik) => (init[ik] = 0));
        grouped.set(label, init);
      }
      const g = grouped.get(label)!;
      metricKeys.forEach((mk, i) => {
        const n = tryParseNumber(r[mk]);
        if (n === null) return;
        g[metricInternalKeys[i]] += n;
      });
    }

    const data = Array.from(grouped.entries()).map(([label, metrics]) => ({
      label,
      ...metrics
    }));

    // Sort bars/pies by primary metric descending.
    const primary = metricInternalKeys[0];
    data.sort((a, b) => (b[primary] ?? 0) - (a[primary] ?? 0));

    if (type === 'pie') return data.slice(0, 8) as any[];
    return data.slice(0, 15) as any[];
  }, [rows, chartConfig]);

  const exportRows = () => {
    const safeType = chartType ?? 'chart';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToExcel({
      json: rows,
      fileName: `ai_bill_analyst_${safeType}_${timestamp}`
    });
  };

  if (!chartConfig || chartData.length === 0) return null;

  const metricInternalKeys = chartConfig.metricKeys.map((_, idx) => `metric${idx + 1}`);
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const chartSeriesConfig = metricInternalKeys.reduce(
    (acc, key, idx) => {
      acc[key] = {
        label: chartConfig.metricKeys[idx] ?? key,
        color: COLORS[idx % COLORS.length]
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-sm">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Auto-rendered from your query results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={exportRows}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={expanded ? 'Collapse chart' : 'Expand chart'}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown className={expanded ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={expanded ? 'h-[420px]' : 'h-[250px]'} aria-hidden="false">
          <ChartContainer
            id="ai-analyst-query-chart"
            config={chartSeriesConfig as any}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip />
                  {metricInternalKeys.map((k) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      name={chartSeriesConfig[k]?.label}
                      fill={`var(--color-${k})`}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}

              {chartType === 'line' && (
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip />
                  {metricInternalKeys.map((k) => (
                    <Line
                      key={k}
                      type="monotone"
                      dataKey={k}
                      name={chartSeriesConfig[k]?.label}
                      stroke={`var(--color-${k})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              )}

              {chartType === 'pie' && (
                <PieChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <ChartTooltip />
                  <Pie
                    data={chartData}
                    dataKey={metricInternalKeys[0]}
                    nameKey="label"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={2}
                    label={(entry) => String(entry.label)}
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

