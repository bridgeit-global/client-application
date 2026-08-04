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
