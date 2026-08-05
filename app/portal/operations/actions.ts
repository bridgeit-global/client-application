'use server';

import {
  fetchApprovedPostpaidBills,
  fetchApprovedPrepaidRecharges,
  fetchBillRecommendations,
  fetchLowBalanceConnections,
  fetchNewBills,
  fetchPostpaidAllBills,
  fetchPrepaidAllBills,
  fetchRechargeRecommendations
} from '@/services/bills';
import { fetchAllBatches } from '@/services/batches';
import {
  fetchBatchPayment,
  fetchClientWallet,
  fetchPostpaidPaid,
  fetchPrepaidPaid
} from '@/services/payments';
import { fetchArrearsReport, fetchPenaltiesReport } from '@/services/reports';
import {
  createClient,
  createServicePortalClient
} from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';
import { toLocalDateString } from '@/lib/utils/date-format';
import { SearchParamsProps } from '@/types';

export type CreatePrepaidRechargeInput = {
  connectionId: string;
  rechargeAmount: number;
  rechargeDate: string; // yyyy-MM-dd
};

export type CreatePrepaidRechargeResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Create an approved prepaid recharge from Low Balance.
 * Client-side inserts are blocked by RLS; this verifies the connection is
 * visible to the signed-in user, then inserts with the portal service client.
 */
export async function createPrepaidRecharge(
  input: CreatePrepaidRechargeInput
): Promise<CreatePrepaidRechargeResult> {
  const connectionId = input.connectionId?.trim();
  const rechargeAmount = Number(input.rechargeAmount);
  const rechargeDate = input.rechargeDate?.trim();

  if (!connectionId) {
    return { ok: false, error: 'Connection is required.' };
  }
  if (!Number.isFinite(rechargeAmount) || rechargeAmount < 100) {
    return { ok: false, error: 'Minimum recharge amount is ₹100.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rechargeDate || '')) {
    return { ok: false, error: 'Recharge date is required.' };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'You must be signed in to request a recharge.' };
  }

  // RLS-scoped: if the user cannot see this connection, deny.
  const { data: connection, error: connectionError } = await supabase
    .from('low_balance_connections')
    .select('id, current_status')
    .eq('id', connectionId)
    .maybeSingle();

  if (connectionError) {
    return {
      ok: false,
      error: handleDatabaseError(connectionError).message
    };
  }
  if (!connection?.id) {
    return {
      ok: false,
      error: 'Connection not found or you do not have access.'
    };
  }
  if (connection.current_status === true) {
    return {
      ok: false,
      error: 'A recharge is already pending for this connection.'
    };
  }

  const portal = createServicePortalClient();
  const { data, error } = await portal
    .from('prepaid_recharge')
    .insert({
      connection_id: connectionId,
      recharge_amount: rechargeAmount,
      recharge_date: rechargeDate,
      recharge_status: 'approved'
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, error: handleDatabaseError(error).message };
  }

  return { ok: true, id: data.id };
}

export async function getBillOverview(searchParams: SearchParamsProps) {
  const [{ data }, { data: arrearsData }, { data: penalties }] =
    await Promise.all([
      fetchPostpaidAllBills(searchParams),
      fetchArrearsReport(),
      fetchPenaltiesReport()
    ]);
  return { data, arrearsData: arrearsData ?? [], penalties: penalties ?? [] };
}

export type InsightsSummary = {
  dueThisWeekCount: number;
  dueThisWeekAmount: number;
  arrearsPending: number;
  arrearsNet: number;
  penaltiesTotal: number;
};

type ArrearsRow = {
  positive_arrears?: number | null;
  negative_arrears?: number | null;
};

type PenaltyRow = {
  lpsc?: number | null;
  tod_surcharge?: number | null;
  sanctioned_load_penalty?: number | null;
  power_factor_penalty?: number | null;
  capacitor_surcharge?: number | null;
};

const penaltyRowTotal = (p: PenaltyRow): number =>
  (p.lpsc || 0) +
  (p.tod_surcharge || 0) +
  (p.sanctioned_load_penalty || 0) +
  (p.power_factor_penalty || 0) +
  (p.capacitor_surcharge || 0);

/**
 * Glanceable aggregates for the Operational Insights header chips. Fetched
 * deferred on the client so it never competes with the first panel load.
 */
export async function getInsightsSummary(): Promise<InsightsSummary> {
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);

  const supabase = await createClient();

  const [dueResult, { data: arrearsData }, { data: penaltiesData }] =
    await Promise.all([
      supabase
        .from('bills')
        .select('bill_amount, connections!inner(id)')
        .match({
          is_active: true,
          is_valid: true,
          is_deleted: false,
          payment_status: false
        })
        .in('bill_status', ['new', 'approved'])
        .gte('due_date', toLocalDateString())
        .lte('due_date', toLocalDateString(weekEnd))
        .not('connections.paytype', 'eq', 0)
        .eq('connections.is_active', true),
      fetchArrearsReport(),
      fetchPenaltiesReport()
    ]);

  if (dueResult.error) {
    console.error('getInsightsSummary due-this-week error', dueResult.error);
  }

  const dueRows: { bill_amount?: number | null }[] = dueResult.data ?? [];
  const arrearsRows: ArrearsRow[] = arrearsData ?? [];
  const penaltyRows: PenaltyRow[] = penaltiesData ?? [];

  const arrearsPending = arrearsRows.reduce(
    (sum, row) => sum + (row.positive_arrears || 0),
    0
  );
  const arrearsNet = arrearsRows.reduce(
    (sum, row) => sum + (row.positive_arrears || 0) + (row.negative_arrears || 0),
    0
  );

  return {
    dueThisWeekCount: dueRows.length,
    dueThisWeekAmount: dueRows.reduce(
      (sum, row) => sum + (Number(row.bill_amount) || 0),
      0
    ),
    arrearsPending,
    arrearsNet,
    penaltiesTotal: penaltyRows.reduce(
      (sum, row) => sum + penaltyRowTotal(row),
      0
    )
  };
}

export async function getNewBills(searchParams: SearchParamsProps) {
  return fetchNewBills(searchParams);
}

export async function getApprovedBills(searchParams: SearchParamsProps) {
  const [result, recommendationData] = await Promise.all([
    fetchApprovedPostpaidBills(searchParams),
    fetchBillRecommendations()
  ]);
  return { ...result, recommendationData };
}

export async function getRechargeOverview(searchParams: SearchParamsProps) {
  return fetchPrepaidAllBills(searchParams);
}

export async function getLowBalanceConnections(searchParams: SearchParamsProps) {
  return fetchLowBalanceConnections(searchParams);
}

export async function getApprovedRecharges(searchParams: SearchParamsProps) {
  const [result, recommendationData] = await Promise.all([
    fetchApprovedPrepaidRecharges(searchParams),
    fetchRechargeRecommendations()
  ]);
  return { ...result, recommendationData };
}

export async function getBatches(searchParams: SearchParamsProps) {
  return fetchAllBatches(searchParams);
}

export async function getBatchPayments(searchParams: SearchParamsProps) {
  return fetchBatchPayment(searchParams);
}

export async function getSettlementRequiredBatchCount(): Promise<{
  count: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('batches')
    .select('batch_id', { count: 'exact', head: true })
    .eq('batch_status', 'client_paid');

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0 };
}

export type OperationsFlowCounts = {
  newCount: number;
  approvedCount: number;
  settlementCount: number;
};

/**
 * Count-only query for flow-rail badges. Uses head:true so no rows are
 * transferred; the previous implementation ran the full panel select
 * (nested connections/bills) with limit=1 just to read totalCount.
 */
type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

async function countOnly(
  buildQuery: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<CountResult>
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await buildQuery(supabase);
  if (error) return 0;
  return count ?? 0;
}

async function getNewBillsCount(): Promise<number> {
  return countOnly((supabase) =>
    supabase
      .from('bills')
      // Nested filters require the relationship in the select (!inner).
      .select('id, connections!inner(id)', { count: 'exact', head: true })
      .match({
        is_active: true,
        is_valid: true,
        bill_status: 'new',
        payment_status: false,
        is_deleted: false
      })
      .not('connections.paytype', 'eq', 0)
      .eq('connections.is_active', true)
  );
}

async function getLowBalanceCount(): Promise<number> {
  return countOnly((supabase) =>
    supabase
      .from('low_balance_connections')
      .select('id', { count: 'exact', head: true })
      .match({ is_active: true, is_deleted: false, paytype: 0 })
  );
}

async function getApprovedBillsCount(): Promise<number> {
  return countOnly((supabase) =>
    supabase
      .from('bills')
      .select('id, connections!inner(id)', { count: 'exact', head: true })
      .match({
        is_active: true,
        is_valid: true,
        payment_status: false,
        bill_status: 'approved',
        is_deleted: false
      })
      .not('connections.paytype', 'eq', 0)
      .eq('connections.is_active', true)
      .eq('connections.is_deleted', false)
  );
}

async function getApprovedRechargesCount(): Promise<number> {
  return countOnly((supabase) =>
    supabase
      .from('prepaid_recharge')
      .select('id, connections!inner(id)', { count: 'exact', head: true })
      .eq('connections.paytype', 0)
      .eq('connections.is_active', true)
      .eq('recharge_status', 'approved')
      .eq('is_active', true)
      .eq('is_deleted', false)
  );
}

/**
 * Aggregated actionable counts for the Operations flow rail badges.
 * Count-only queries (head:true) so badges stay cheap and never pull
 * the panels' nested list payloads.
 */
export async function getOperationsFlowCounts(): Promise<OperationsFlowCounts> {
  const [newBills, lowBalance, approvedBills, approvedRecharges, settlement] =
    await Promise.all([
      getNewBillsCount(),
      getLowBalanceCount(),
      getApprovedBillsCount(),
      getApprovedRechargesCount(),
      getSettlementRequiredBatchCount()
    ]);

  return {
    newCount: newBills + lowBalance,
    approvedCount: approvedBills + approvedRecharges,
    settlementCount: settlement.count
  };
}

export async function getBillsPaid(searchParams: SearchParamsProps) {
  return fetchPostpaidPaid(searchParams);
}

export async function getRechargesPaid(searchParams: SearchParamsProps) {
  return fetchPrepaidPaid(searchParams);
}

export async function getWalletStatement(searchParams: SearchParamsProps) {
  const result = await fetchClientWallet(searchParams);
  const supabase = await createClient();
  const { data: amountData } = await supabase
    .rpc('is_approved_amount_within_threshold')
    .select()
    .single();

  return {
    ...result,
    pendingAmount:
      (amountData as { pending_amount?: number } | null)?.pending_amount ?? 0,
    summary: result.summary ?? {
      credits: 0,
      debits: 0,
      balance: 0,
      count: 0
    }
  };
}
