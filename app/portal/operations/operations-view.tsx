'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PortalPageHeader } from '@/components/portal/PortalPageHeader';
import { LazyLoadSection } from '@/components/lazy-load-section';
import { Card, CardContent } from '@/components/ui/card';
import {
  OperationsFlowRail,
  type FlowSectionId
} from './operations-flow-rail';
import { OperationalInsightsPanel } from './panels/operational-insights-panel';
import { BillNewPanel } from './panels/bill-new-panel';
import { BillApprovedPanel } from './panels/bill-approved-panel';
import { RechargeLowBalancePanel } from './panels/recharge-low-balance-panel';
import { RechargeApprovedPanel } from './panels/recharge-approved-panel';
import { BatchesPanel } from './panels/batches-panel';
import { BatchPaymentsPanel } from './panels/batch-payments-panel';

export type OperationsTabId =
  | 'bill-new'
  | 'bill-approved'
  | 'recharge-low-balance'
  | 'recharge-approved'
  | 'batch-batches'
  | 'batch-payments';

type SectionId = FlowSectionId;

const TAB_TO_SECTION: Record<OperationsTabId, SectionId> = {
  'bill-new': 'new',
  'recharge-low-balance': 'new',
  'bill-approved': 'approved',
  'recharge-approved': 'approved',
  'batch-batches': 'batch',
  'batch-payments': 'batch'
};

const SECTION_DEFAULT_TAB: Record<SectionId, OperationsTabId> = {
  new: 'bill-new',
  approved: 'bill-approved',
  batch: 'batch-batches'
};

const VALID_TABS = new Set<string>(Object.keys(TAB_TO_SECTION));

function parseTab(value: string | null): OperationsTabId | null {
  if (!value) return null;
  return VALID_TABS.has(value) ? (value as OperationsTabId) : null;
}

type SectionTabsProps = {
  sectionId: SectionId;
  tabs: { id: OperationsTabId; label: string }[];
  activeTab: OperationsTabId;
  onTabChange: (tab: OperationsTabId) => void;
  /** Quiet link to the next pipeline stage — orientation lives on the flow rail. */
  nextStep?: { sectionId: SectionId; label: string };
  onNavigateSection: (section: SectionId) => void;
  forceVisible: boolean;
  renderPanel: (tab: OperationsTabId, enabled: boolean) => React.ReactNode;
};

function OperationsSection({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  nextStep,
  onNavigateSection,
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
      // No positive rootMargin — preloading Approved/Batch (heavy nested
      // selects) while New Bills is still in flight kept that panel on
      // skeletons for many seconds.
      rootMargin="0px"
      placeholderHeight={640}
      className="scroll-mt-20"
    >
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-4">
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
          {nextStep ? (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onNavigateSection(nextStep.sectionId)}
              >
                {nextStep.label}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </LazyLoadSection>
  );
}

export function OperationsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = parseTab(searchParams.get('tab'));

  const [activeTab, setActiveTab] = useState<OperationsTabId>(
    tabFromUrl ?? 'bill-new'
  );
  const [forcedSection, setForcedSection] = useState<SectionId | null>(
    tabFromUrl ? TAB_TO_SECTION[tabFromUrl] : 'new'
  );

  // Deep-link / same-page nav: keep tab + force section in sync with ?tab=,
  // then scroll the Batch (or other) section into view. Query-only navigations
  // do not remount this page, so mount-only state/effects are not enough.
  useEffect(() => {
    if (!tabFromUrl) return;

    setActiveTab(tabFromUrl);
    setForcedSection(TAB_TO_SECTION[tabFromUrl]);

    const sectionId = TAB_TO_SECTION[tabFromUrl];
    const timer = window.setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [tabFromUrl]);

  const handleTabChange = useCallback(
    (tab: OperationsTabId) => {
      setActiveTab(tab);
      setForcedSection(TAB_TO_SECTION[tab]);
      // Drop panel filter query params when switching tabs so date deep-links
      // from Calendar only seed the destination panel, not sibling tabs.
      router.replace(`/portal/operations?tab=${tab}`, {
        scroll: false
      });
    },
    [router]
  );

  const handleSectionNavigate = useCallback(
    (section: SectionId) => {
      handleTabChange(SECTION_DEFAULT_TAB[section]);
      document
        .getElementById(section)
        ?.scrollIntoView({ behavior: 'smooth' });
    },
    [handleTabChange]
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
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PortalPageHeader
        title="Operations"
        description="Approve, batch, and settle."
      />

      <OperationalInsightsPanel />

      <OperationsFlowRail
        activeSection={TAB_TO_SECTION[activeTab]}
        onNavigate={handleSectionNavigate}
      />

      <OperationsSection
        sectionId="new"
        tabs={[
          { id: 'bill-new', label: 'New Bills' },
          { id: 'recharge-low-balance', label: 'Low Balance' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        nextStep={{ sectionId: 'approved', label: 'Next: Approved' }}
        onNavigateSection={handleSectionNavigate}
        forceVisible={forcedSection === 'new'}
        renderPanel={renderPanel}
      />

      <OperationsSection
        sectionId="approved"
        tabs={[
          { id: 'bill-approved', label: 'Bills' },
          { id: 'recharge-approved', label: 'Recharges' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        nextStep={{ sectionId: 'batch', label: 'Next: Batch' }}
        onNavigateSection={handleSectionNavigate}
        forceVisible={forcedSection === 'approved'}
        renderPanel={renderPanel}
      />

      <OperationsSection
        sectionId="batch"
        tabs={[
          { id: 'batch-batches', label: 'Batches' },
          { id: 'batch-payments', label: 'Payments' }
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateSection={handleSectionNavigate}
        forceVisible={forcedSection === 'batch'}
        renderPanel={renderPanel}
      />
    </div>
  );
}
