'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading } from '@/components/ui/heading';
import { LazyLoadSection } from '@/components/lazy-load-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OperationalInsightsPanel } from './panels/operational-insights-panel';
import { BillNewPanel } from './panels/bill-new-panel';
import { BillApprovedPanel } from './panels/bill-approved-panel';
import { RechargeLowBalancePanel } from './panels/recharge-low-balance-panel';
import { RechargeApprovedPanel } from './panels/recharge-approved-panel';
import { BatchesPanel } from './panels/batches-panel';
import { BatchPaymentsPanel } from './panels/batch-payments-panel';
import { BillsPaidPanel, RechargesPaidPanel } from './panels/paid-panels';
import { StatementPanel } from './panels/statement-panel';

export type OperationsTabId =
  | 'bill-new'
  | 'bill-approved'
  | 'recharge-low-balance'
  | 'recharge-approved'
  | 'batch-batches'
  | 'batch-payments'
  | 'payment-bills-paid'
  | 'payment-recharges-paid'
  | 'payment-statement';

type SectionId = 'new' | 'approved' | 'batch' | 'payment';

const TAB_TO_SECTION: Record<OperationsTabId, SectionId> = {
  'bill-new': 'new',
  'recharge-low-balance': 'new',
  'bill-approved': 'approved',
  'recharge-approved': 'approved',
  'batch-batches': 'batch',
  'batch-payments': 'batch',
  'payment-bills-paid': 'payment',
  'payment-recharges-paid': 'payment',
  'payment-statement': 'payment'
};

const SECTION_DEFAULT_TAB: Record<SectionId, OperationsTabId> = {
  new: 'bill-new',
  approved: 'bill-approved',
  batch: 'batch-batches',
  payment: 'payment-bills-paid'
};

const VALID_TABS = new Set<string>(Object.keys(TAB_TO_SECTION));

function parseTab(value: string | null): OperationsTabId | null {
  if (!value) return null;
  return VALID_TABS.has(value) ? (value as OperationsTabId) : null;
}

type SectionTabsProps = {
  sectionId: SectionId;
  title: string;
  description: string;
  tabs: { id: OperationsTabId; label: string }[];
  activeTab: OperationsTabId;
  onTabChange: (tab: OperationsTabId) => void;
  forceVisible: boolean;
  renderPanel: (tab: OperationsTabId, enabled: boolean) => React.ReactNode;
};

function OperationsSection({
  sectionId,
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  forceVisible,
  renderPanel
}: SectionTabsProps) {
  const [sectionVisible, setSectionVisible] = useState(forceVisible);
  const sectionTabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);
  const currentTab = sectionTabIds.includes(activeTab)
    ? activeTab
    : tabs[0].id;

  // Track which tabs have been activated at least once (fetch-once-per-tab)
  const [activatedTabs, setActivatedTabs] = useState<Set<OperationsTabId>>(
    () => new Set(forceVisible ? [currentTab] : [])
  );

  useEffect(() => {
    if (forceVisible) setSectionVisible(true);
  }, [forceVisible]);

  useEffect(() => {
    if (!sectionVisible) return;
    if (sectionTabIds.includes(activeTab)) {
      setActivatedTabs((prev) => {
        if (prev.has(activeTab)) return prev;
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      });
    }
  }, [sectionVisible, activeTab, sectionTabIds]);

  const handleVisible = useCallback(() => {
    setSectionVisible(true);
    setActivatedTabs((prev) => {
      if (prev.has(currentTab)) return prev;
      const next = new Set(prev);
      next.add(currentTab);
      return next;
    });
  }, [currentTab]);

  return (
    <LazyLoadSection
      id={sectionId}
      forceVisible={forceVisible}
      onVisible={handleVisible}
      placeholderHeight={480}
      className="scroll-mt-20"
    >
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight">
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          <Tabs
            value={currentTab}
            onValueChange={(v) => onTabChange(v as OperationsTabId)}
            className="w-full"
          >
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => {
              const enabled =
                sectionVisible &&
                (activatedTabs.has(tab.id) || currentTab === tab.id);
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  {enabled ? renderPanel(tab.id, true) : null}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </LazyLoadSection>
  );
}

export function OperationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseTab(searchParams.get('tab'));

  const [activeTab, setActiveTab] = useState<OperationsTabId>(
    initialTab ?? 'bill-new'
  );
  const [forcedSection, setForcedSection] = useState<SectionId | null>(
    initialTab ? TAB_TO_SECTION[initialTab] : 'new'
  );

  // Deep-link: scroll to section once on mount when ?tab= is present
  useEffect(() => {
    if (!initialTab) return;
    const section = TAB_TO_SECTION[initialTab];
    const timer = setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = useCallback(
    (tab: OperationsTabId) => {
      setActiveTab(tab);
      setForcedSection(TAB_TO_SECTION[tab]);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`/portal/operations?${params.toString()}`, {
        scroll: false
      });
    },
    [router, searchParams]
  );

  const renderPanel = (tab: OperationsTabId, enabled: boolean) => {
    switch (tab) {
      case 'bill-new':
        return <BillNewPanel enabled={enabled} />;
      case 'bill-approved':
        return <BillApprovedPanel enabled={enabled} />;
      case 'recharge-low-balance':
        return <RechargeLowBalancePanel enabled={enabled} />;
      case 'recharge-approved':
        return <RechargeApprovedPanel enabled={enabled} />;
      case 'batch-batches':
        return <BatchesPanel enabled={enabled} />;
      case 'batch-payments':
        return <BatchPaymentsPanel enabled={enabled} />;
      case 'payment-bills-paid':
        return <BillsPaidPanel enabled={enabled} />;
      case 'payment-recharges-paid':
        return <RechargesPaidPanel enabled={enabled} />;
      case 'payment-statement':
        return <StatementPanel enabled={enabled} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <Heading
        title="Operations"
        description="New and low balance items flow into approvals, then batches, then payments. Sections load as you scroll."
      />

      <OperationalInsightsPanel />

      <nav className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 border-b border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {(
          [
            { id: 'new', label: 'New' },
            { id: 'approved', label: 'Approved' },
            { id: 'batch', label: 'Batch' },
            { id: 'payment', label: 'Payment' }
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
            onClick={() => {
              const tab = SECTION_DEFAULT_TAB[item.id];
              handleTabChange(tab);
              setForcedSection(item.id);
              document
                .getElementById(item.id)
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <OperationsSection
        sectionId="new"
        title="New"
        description="New bills and low balance connections awaiting action"
        tabs={[
          { id: 'bill-new', label: 'New Bills' },
          { id: 'recharge-low-balance', label: 'Low Balance' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        forceVisible={forcedSection === 'new'}
        renderPanel={renderPanel}
      />

      <OperationsSection
        sectionId="approved"
        title="Approved"
        description="Approved bills and recharges ready to be batched"
        tabs={[
          { id: 'bill-approved', label: 'Bills' },
          { id: 'recharge-approved', label: 'Recharges' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        forceVisible={forcedSection === 'approved'}
        renderPanel={renderPanel}
      />

      <OperationsSection
        sectionId="batch"
        title="Batch"
        description="Manage batches and batch payments"
        tabs={[
          { id: 'batch-batches', label: 'Batches' },
          { id: 'batch-payments', label: 'Payments' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        forceVisible={forcedSection === 'batch'}
        renderPanel={renderPanel}
      />

      <OperationsSection
        sectionId="payment"
        title="Payment"
        description="Paid bills, paid recharges, and wallet statement"
        tabs={[
          { id: 'payment-bills-paid', label: 'Bills Paid' },
          { id: 'payment-recharges-paid', label: 'Recharges Paid' },
          { id: 'payment-statement', label: 'Statement' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        forceVisible={forcedSection === 'payment'}
        renderPanel={renderPanel}
      />
    </div>
  );
}
