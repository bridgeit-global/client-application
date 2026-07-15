'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAsyncData } from '@/hooks/use-async-data';
import { getBillOverview, getRechargeOverview } from '../actions';
import { PanelError, PanelLoading } from '../panel-states';

type InsightsTab = 'bill' | 'recharge';

function BillInsightsContent({ enabled }: { enabled: boolean }) {
  const [type, setType] = useState<string[]>([]);
  const typeKey = type.join(',');
  const { data, isLoading, error, refetch } = useAsyncData(
    () => getBillOverview(typeKey ? { type: typeKey } : {}),
    { enabled, deps: [typeKey] }
  );

  if (error) return <PanelError message={error.message} onRetry={refetch} />;
  if (isLoading && !data) return <PanelLoading rows={6} />;

  return (
    <>
      <StationTypeSelector value={type} onChange={(types) => setType(types)} />
      <Calendar
        billsData={data?.data ?? []}
        sectionDetails={{ status: 'all', type: 'postpaid' }}
      />
      <div className="grid gap-8">
        {(data?.arrearsData?.length ?? 0) > 0 ? (
          <div id="arrear-report">
            <ArrearsTable data={data!.arrearsData} />
          </div>
        ) : null}
        {(data?.penalties?.length ?? 0) > 0 ? (
          <div id="penalties-report">
            <PenaltiesTable data={data!.penalties} />
          </div>
        ) : null}
      </div>
    </>
  );
}

function RechargeInsightsContent({ enabled }: { enabled: boolean }) {
  const [type, setType] = useState<string[]>([]);
  const typeKey = type.join(',');
  const { data, isLoading, error, refetch } = useAsyncData(
    () => getRechargeOverview(typeKey ? { type: typeKey } : {}),
    { enabled, deps: [typeKey] }
  );

  if (error) return <PanelError message={error.message} onRetry={refetch} />;
  if (isLoading && !data) return <PanelLoading rows={6} />;

  return (
    <>
      <StationTypeSelector value={type} onChange={(types) => setType(types)} />
      <Calendar
        billsData={data?.data ?? []}
        sectionDetails={{ status: 'all', type: 'prepaid' }}
      />
    </>
  );
}

export function OperationalInsightsPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightsTab>('bill');
  const [activatedTabs, setActivatedTabs] = useState<Set<InsightsTab>>(
    new Set()
  );

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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">
                Operational Insights
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bill calendar, recharge calendar, arrears, and penalties
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    open && 'rotate-180'
                  )}
                />
                {open ? 'Hide' : 'Show'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t border-border pt-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as InsightsTab)}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="bill">Bill</TabsTrigger>
                <TabsTrigger value="recharge">Recharge</TabsTrigger>
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
