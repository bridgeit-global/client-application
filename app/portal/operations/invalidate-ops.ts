import { invalidateAsyncData } from '@/hooks/use-async-data';

/**
 * Named Operations panel scopes. Values match `cacheScope` used by panels /
 * flow rail so mutations can invalidate without hard-coding prefixes.
 */
export const OPS_SCOPES = {
  billNew: 'ops:bill-new',
  billApproved: 'ops:bill-approved',
  rechargeLowBalance: 'ops:panel:recharge-low-balance',
  rechargeApproved: 'ops:recharge-approved',
  batches: 'ops:panel:batch-batches',
  settlementCount: 'ops:settlement-count',
  batchPayments: 'ops:batch-payments',
  flowCounts: 'ops:flow-counts',
  insightsSummary: 'ops:insights-summary',
  insights: 'ops:insights'
} as const;

export type OpsScopeKey = keyof typeof OPS_SCOPES;

/**
 * Clear Operations `useAsyncData` session cache for the given scopes and
 * refetch any mounted panels that match.
 */
export function invalidateOps(...keys: OpsScopeKey[]): void {
  if (keys.length === 0) return;
  invalidateAsyncData(keys.map((key) => OPS_SCOPES[key]));
}
