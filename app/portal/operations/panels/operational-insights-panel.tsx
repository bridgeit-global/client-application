'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronDown } from 'lucide-react';
import Calendar from '@/components/calendar';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import { ArrearsTable } from '@/components/tables/report/arrears-table';
import PenaltiesTable from '@/components/tables/report/penalties-table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { useAsyncData } from '@/hooks/use-async-data';
import type { ArrearsProps, PenaltiesProps } from '@/types/charges-type';
import { getBillOverview, getInsightsSummary, getPrepaidBalanceHealth } from '../actions';
import { PanelCalendarLoading, PanelError, PanelHealthLoading } from '../panel-states';

type InsightsTab = 'bill' | 'recharge';

const LEGEND_STATUSES = [
  { status: 'new', postpaid: 'New', prepaid: 'Low Balance' },
  { status: 'approved', postpaid: 'Approved', prepaid: 'Approved' },
  { status: 'batch', postpaid: 'Batch', prepaid: 'Batch' },
  { status: 'payment', postpaid: 'Payment', prepaid: 'Payment' },
  { status: 'paid', postpaid: 'Paid', prepaid: 'Paid' },
  { status: 'rejected', postpaid: 'Rejected', prepaid: 'Rejected' }
] as const;

/** Dot colors resolve to the same --status-* vars the calendar badges use. */
function StatusLegend({ type }: { type: 'postpaid' | 'prepaid' }) {
  return (
    <div
      className="hidden flex-wrap items-center gap-x-3 gap-y-1 sm:flex"
      aria-hidden
    >
      {LEGEND_STATUSES.map((item) => (
        <span
          key={item.status}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: `var(--status-${item.status})` }}
          />
          {type === 'postpaid' ? item.postpaid : item.prepaid}
        </span>
      ))}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold text-foreground', valueClassName)}>
        {value}
      </span>
    </span>
  );
}

function InsightsReportSection({
  title,
  totalLabel,
  totalValue,
  children
}: {
  title: string;
  totalLabel: string;
  totalValue: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <SummaryChip label={totalLabel} value={totalValue} />
      </div>
      {children}
    </section>
  );
}

const RANGE_HINT =
  'Click a status chip to open that list. Select any two dates for a range summary.';

function BillInsightsContent({ enabled }: { enabled: boolean }) {
  const [type, setType] = useState<string[]>([]);
  const typeKey = type.join(',');
  const { data, isLoading, error, refetch } = useAsyncData(
    () => getBillOverview(typeKey ? { type: typeKey } : {}),
    { enabled, deps: [typeKey], cacheScope: 'ops:insights:bill' }
  );

  if (error) return <PanelError message={error.message} onRetry={refetch} />;
  if (isLoading && !data) return <PanelCalendarLoading />;

  const rows = data?.data ?? [];
  const arrears: ArrearsProps[] = data?.arrearsData ?? [];
  const penalties: PenaltiesProps[] = data?.penalties ?? [];

  const arrearsNet = arrears.reduce(
    (sum: number, row) =>
      sum + (row.positive_arrears || 0) + (row.negative_arrears || 0),
    0
  );
  const penaltiesTotal = penalties.reduce(
    (sum: number, row) =>
      sum +
      (row.lpsc || 0) +
      (row.tod_surcharge || 0) +
      (row.sanctioned_load_penalty || 0) +
      (row.power_factor_penalty || 0) +
      (row.capacitor_surcharge || 0),
    0
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusLegend type="postpaid" />
        <StationTypeSelector
          value={type}
          onChange={(types) => setType(types)}
          className="ml-auto"
        />
      </div>
      <Calendar
        billsData={rows}
        sectionDetails={{ status: 'all', type: 'postpaid' }}
      />
      <p className="text-xs text-muted-foreground">{RANGE_HINT}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bills for the selected filters.
        </p>
      ) : null}
      {arrears.length > 0 ? (
        <InsightsReportSection
          title="Arrears on active bills"
          totalLabel="Net"
          totalValue={formatRupees(arrearsNet)}
        >
          <ArrearsTable data={arrears} title={null} />
        </InsightsReportSection>
      ) : null}
      {penalties.length > 0 ? (
        <InsightsReportSection
          title="Penalties summary"
          totalLabel="Total"
          totalValue={formatRupees(penaltiesTotal)}
        >
          <PenaltiesTable data={penalties} title={null} />
        </InsightsReportSection>
      ) : null}
    </>
  );
}

function HealthCard({
  title,
  count,
  caption,
  accentClassName,
  href
}: {
  title: string;
  count: number;
  caption: string;
  accentClassName?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {href ? (
          <span className="text-xs font-medium text-primary">View</span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight',
          accentClassName
        )}
      >
        {count}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {body}
      </Link>
    );
  }

  return body;
}

function RechargeInsightsContent({ enabled }: { enabled: boolean }) {
  const [type, setType] = useState<string[]>([]);
  const typeKey = type.join(',');
  const { data, isLoading, error, refetch } = useAsyncData(
    () => getPrepaidBalanceHealth(typeKey ? { type: typeKey } : {}),
    { enabled, deps: [typeKey], cacheScope: 'ops:insights:recharge-health' }
  );

  if (error) return <PanelError message={error.message} onRetry={refetch} />;
  if (isLoading && !data) return <PanelHealthLoading />;

  const health = data;
  const hasConnections = (health?.totalCount ?? 0) > 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Prepaid balance health across active connections
        </p>
        <StationTypeSelector
          value={type}
          onChange={(types) => setType(types)}
          className="ml-auto"
        />
      </div>

      {hasConnections ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <HealthCard
            title="Nearing low balance"
            count={health?.nearingCount ?? 0}
            caption="Below 1.5× threshold"
            accentClassName="text-amber-600 dark:text-amber-500"
            href="/portal/operations?tab=recharge-low-balance"
          />
          <HealthCard
            title="Safe"
            count={health?.safeCount ?? 0}
            caption="At or above 1.5× threshold"
            accentClassName="text-emerald-600 dark:text-emerald-500"
          />
          <HealthCard
            title="Fetch issues"
            count={health?.fetchIssueCount ?? 0}
            caption="No fetch, stale 3+ days, or no threshold"
            accentClassName="text-destructive"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No prepaid connections.
        </p>
      )}

      {hasConnections ? (
        <p className="text-xs text-muted-foreground">
          {health?.totalCount ?? 0} prepaid connections
        </p>
      ) : null}
    </>
  );
}

export function OperationalInsightsPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightsTab>('bill');
  const [activatedTabs, setActivatedTabs] = useState<Set<InsightsTab>>(
    new Set()
  );

  // Defer header chips so they never compete with the first panel fetch
  // (same pattern as the flow-rail badge counts).
  const [summaryEnabled, setSummaryEnabled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSummaryEnabled(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const {
    data: summary,
    error: summaryError
  } = useAsyncData(() => getInsightsSummary(), {
    enabled: summaryEnabled,
    deps: [],
    cacheScope: 'ops:insights-summary'
  });

  useEffect(() => {
    if (!open) return;
    setActivatedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [open, activeTab]);

  return (
    <Card className="border-border bg-card shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full flex-col gap-3 rounded-t-xl p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=closed]:rounded-b-xl sm:px-6 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">
                  Insights
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {summary ? (
                  <>
                    <SummaryChip
                      label="Due this week"
                      value={`${summary.dueThisWeekCount} · ${formatRupees(summary.dueThisWeekAmount)}`}
                    />
                    <SummaryChip
                      label="Net arrears"
                      value={formatRupees(summary.arrearsNet)}
                    />
                    <SummaryChip
                      label="Penalties"
                      value={formatRupees(summary.penaltiesTotal)}
                      valueClassName={
                        summary.penaltiesTotal > 0
                          ? 'text-destructive'
                          : undefined
                      }
                    />
                  </>
                ) : summaryError ? null : (
                  <>
                    <Skeleton className="h-6 w-28 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </>
                )}
                <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {open ? 'Hide' : 'Show'}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      open && 'rotate-180'
                    )}
                    aria-hidden
                  />
                </span>
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t border-border pt-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as InsightsTab)}
              className="w-full"
            >
              <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
                <TabsTrigger value="bill">Bills</TabsTrigger>
                <TabsTrigger value="recharge">Recharges</TabsTrigger>
              </TabsList>
              <TabsContent value="bill" className="space-y-4">
                {activatedTabs.has('bill') ? (
                  <BillInsightsContent
                    enabled={open && activeTab === 'bill'}
                  />
                ) : null}
              </TabsContent>
              <TabsContent value="recharge" className="space-y-4">
                {activatedTabs.has('recharge') ? (
                  <RechargeInsightsContent
                    enabled={open && activeTab === 'recharge'}
                  />
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
