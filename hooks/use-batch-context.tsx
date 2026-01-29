'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Routes where batch cart functionality is relevant and should be shown
 */
export const BATCH_RELEVANT_ROUTES = [
  '/portal/bills/approved',
  '/portal/recharges/approved',
  '/portal/batch',
] as const;

/**
 * Route prefixes for batch-related pages (including dynamic routes like /portal/batch/[id])
 */
export const BATCH_ROUTE_PREFIXES = [
  '/portal/bills/approved',
  '/portal/recharges/approved',
  '/portal/batch',
] as const;

export interface BatchContextInfo {
  /** Whether the current page supports batch cart functionality */
  isBatchRelevantPage: boolean;
  /** Whether the current page is the approved bills page */
  isApprovedBillsPage: boolean;
  /** Whether the current page is the approved recharges page */
  isApprovedRechargesPage: boolean;
  /** Whether the current page is any batch management page */
  isBatchPage: boolean;
  /** Current pathname */
  pathname: string;
  /** Human-readable label for the current batch context */
  contextLabel: string;
}

/**
 * Hook to determine if the current page is relevant for batch operations
 * and provides context information about the current batch state
 */
export function useBatchContext(): BatchContextInfo {
  const pathname = usePathname();

  return useMemo(() => {
    const isApprovedBillsPage = pathname === '/portal/bills/approved';
    const isApprovedRechargesPage = pathname === '/portal/recharges/approved';
    const isBatchPage = pathname.startsWith('/portal/batch');

    const isBatchRelevantPage = 
      isApprovedBillsPage || 
      isApprovedRechargesPage || 
      isBatchPage;

    let contextLabel = 'Batch Management';
    if (isApprovedBillsPage) {
      contextLabel = 'Bill Batch';
    } else if (isApprovedRechargesPage) {
      contextLabel = 'Recharge Batch';
    } else if (isBatchPage) {
      contextLabel = 'Batch Management';
    }

    return {
      isBatchRelevantPage,
      isApprovedBillsPage,
      isApprovedRechargesPage,
      isBatchPage,
      pathname,
      contextLabel,
    };
  }, [pathname]);
}

/**
 * Utility function to check if a given path is batch-relevant
 * Can be used outside of React components
 */
export function isBatchRelevantPath(pathname: string): boolean {
  return BATCH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}
