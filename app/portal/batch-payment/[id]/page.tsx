import { BillBatchPaymentTable } from "@/components/tables/payment/bill-batch-payment-table"
import { fetchBillPayments } from "@/services/payments"
import { fetchBillsInBatches, fetchRechargesInBatches } from "@/services/batches"
import type { SearchParamsProps } from "@/types"
import { filterIncreaseAmountRecords } from "@/lib/utils"
import { getBatchForCurrentOrg } from "@/lib/batch/get-batch-for-current-org"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { ClientPaymentsProps } from "@/types/payments-type"
import type { AllBillTableProps } from "@/types/bills-type"
import type { PrepaidRechargeTableProps } from "@/types/connections-type"
import type { BatchesProps } from "@/types/batches-type"
import { buildBatchHistoryItems } from "@/lib/batch/build-batch-history-items"

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic'

/** Pay-first pending: no client_payments yet — mirror batch membership for the UI. */
function pendingItemsAsClientPayments(
  batch: NonNullable<Awaited<ReturnType<typeof getBatchForCurrentOrg>>>,
  bills: AllBillTableProps[],
  recharges: PrepaidRechargeTableProps[]
): ClientPaymentsProps[] {
  const batchRow = batch as unknown as BatchesProps
  const fromBills = bills.map((bill) => ({
    id: `pending-bill-${bill.id}`,
    batch_id: batch.batch_id,
    bill_id: bill.id,
    recharge_id: null,
    bill_amount: bill.approved_amount ?? bill.bill_amount,
    paid_amount: null,
    client_paid_amount: null,
    client_paid_date: null,
    ref_id: null,
    status: 'unpaid',
    approval_status: null,
    created_at: bill.created_at,
    updated_at: null,
    updated_by: null,
    bills: {
      ...bill,
      biller_payment_transactions: [],
      refund_payment_transactions: []
    },
    prepaid_recharge: null,
    batches: batchRow
  })) as unknown as ClientPaymentsProps[]

  const fromRecharges = recharges.map((recharge) => ({
    id: `pending-recharge-${recharge.id}`,
    batch_id: batch.batch_id,
    bill_id: null,
    recharge_id: recharge.id,
    bill_amount: recharge.recharge_amount,
    paid_amount: null,
    client_paid_amount: null,
    client_paid_date: null,
    ref_id: null,
    status: 'unpaid',
    approval_status: null,
    created_at: recharge.created_at,
    updated_at: null,
    updated_by: null,
    bills: null,
    prepaid_recharge: {
      ...recharge,
      biller_payment_transactions: [],
      refund_payment_transactions: []
    },
    batches: batchRow
  })) as unknown as ClientPaymentsProps[]

  return [...fromBills, ...fromRecharges]
}

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { id } = params

  if (!id) {
    return <div>Batch ID Not Found</div>
  }

  const scopedBatch = await getBatchForCurrentOrg(id)
  if (!scopedBatch) {
    notFound()
  }

  const paymentsResult = await fetchBillPayments(searchParams, { batch_id: id })
  let { pageCount, data, totalCount, allBills } = paymentsResult
  let pendingGatewayPayment = false

  // Pay-first (scenario B): client_payments appear only after PG approve.
  if ((data?.length || 0) === 0) {
    const supabase = await createClient()
    // payment_gateway_transactions has no org_id — scope via batches FK.
    // scopedBatch is already org-gated; org_id is required for the join filter.
    const orgId = scopedBatch.org_id
    const pgtQuery = orgId
      ? supabase
          .from('payment_gateway_transactions')
          .select('payment_status, batches!inner(org_id)')
          .eq('batch_id', id)
          .eq('batches.org_id', orgId)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null })

    const [{ data: pgt }, billsResult, rechargesResult] = await Promise.all([
      pgtQuery,
      fetchBillsInBatches({ batch_id: id, page: '1', limit: '100' }),
      fetchRechargesInBatches({ batch_id: id, page: '1', limit: '100' })
    ])

    pendingGatewayPayment = Boolean(pgt)
    const pendingRows = pendingItemsAsClientPayments(
      scopedBatch,
      billsResult.data || [],
      rechargesResult.data || []
    )

    if (pendingRows.length > 0) {
      const page = Number(searchParams?.page || 1)
      const limit = Number(searchParams?.limit || 10)
      const offset = (page - 1) * limit
      allBills = pendingRows
      data = pendingRows.slice(offset, offset + limit)
      totalCount = pendingRows.length
      pageCount = Math.ceil(totalCount / limit) || 1
    }
  }

  const increaseAmountRecords = filterIncreaseAmountRecords(allBills)
  const historyItems = await buildBatchHistoryItems(
    (data?.[0]?.batches as any) || scopedBatch
  )
  return (
    <BillBatchPaymentTable
      allBills={allBills || []}
      increaseAmountRecords={increaseAmountRecords}
      batchId={id}
      batch={scopedBatch}
      data={data}
      initialBody={searchParams}
      pageCount={pageCount}
      totalCount={totalCount}
      pendingGatewayPayment={pendingGatewayPayment}
      historyItems={historyItems}
    />
  )
}
