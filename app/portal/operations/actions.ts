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
import { createClient } from '@/lib/supabase/server';
import { SearchParamsProps } from '@/types';

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
