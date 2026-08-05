'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAsyncData } from '@/hooks/use-async-data';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getOperationsFlowCounts } from './actions';

export type FlowSectionId = 'new' | 'approved' | 'batch';

const STEPS: {
  id: FlowSectionId;
  label: string;
  caption: string;
}[] = [
  { id: 'new', label: 'Review', caption: 'Bills & low balance' },
  { id: 'approved', label: 'Approved', caption: 'Ready to batch' },
  { id: 'batch', label: 'Batch', caption: 'Process & settle' }
];

type OperationsFlowRailProps = {
  activeSection: FlowSectionId;
  onNavigate: (section: FlowSectionId) => void;
};

/**
 * Sticky stepper that frames Operations as a single pipeline:
 * Review -> Approved -> Batch. Badges surface where work is waiting.
 */
export function OperationsFlowRail({
  activeSection,
  onNavigate
}: OperationsFlowRailProps) {
  // Defer badge counts until after the active panel has had time to claim
  // the connection — five concurrent count queries were starving New Bills.
  const [badgesEnabled, setBadgesEnabled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setBadgesEnabled(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const { data: counts, refetch } = useAsyncData(
    () => getOperationsFlowCounts(),
    { enabled: badgesEnabled, deps: [], cacheScope: 'ops:flow-counts' }
  );

  // Debounce focus refetch; visibility can fire several times per switch.
  const lastRefetchRef = useRef(0);
  const debouncedRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchRef.current < 2000) return;
    lastRefetchRef.current = now;
    refetch();
  }, [refetch]);
  useRefetchOnFocus(debouncedRefetch);

  const countFor = (id: FlowSectionId): number => {
    if (!counts) return 0;
    if (id === 'new') return counts.newCount;
    if (id === 'approved') return counts.approvedCount;
    return counts.settlementCount;
  };

  return (
    <nav
      aria-label="Operations flow"
      className="sticky top-0 z-10 -mx-1 border-b border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ol className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        {STEPS.map((step, index) => {
          const isActive = step.id === activeSection;
          const count = countFor(step.id);
          const isSettlement = step.id === 'batch' && count > 0;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2"
            >
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'group flex w-full min-w-[9rem] items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  isActive
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-input bg-card hover:bg-accent'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-sm font-medium',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">
                    {step.caption}
                  </span>
                </span>
                {count > 0 ? (
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                      isSettlement
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </button>
              {index < STEPS.length - 1 ? (
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
