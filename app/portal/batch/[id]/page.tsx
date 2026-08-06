
import { getNewBillCount } from "@/lib/utils/bill"
import { isCalendarDateExpired } from "@/lib/utils/date-format"
import { fetchBillsInBatches, fetchRechargesInBatches } from "@/services/batches"
import type { SearchParamsProps } from "@/types"
import { getAfterDueAmount } from '@/lib/utils'
import { BatchItemTable } from "@/components/tables/batch/batch-item-table"
import BatchAction from "@/components/tables/batch/batch-item-table/batch-action"
import BatchHistoryTimeline from "@/components/batch/batch-history-timeline"
import { getBatchForCurrentOrg } from "@/lib/batch/get-batch-for-current-org"
import { buildBatchHistoryItems } from "@/lib/batch/build-batch-history-items"
import { notFound } from "next/navigation"

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic'

export default async function Page(
    props: {
        searchParams: Promise<SearchParamsProps>,
        params: Promise<{ id: string }>
    }
) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const [resolvedSearchParams, resolvedParams] = await Promise.all([searchParams, params]);
    const { id } = resolvedParams;

    const scopedBatch = await getBatchForCurrentOrg(id || '')
    if (!scopedBatch) {
        notFound()
    }

    const filterBody = resolvedSearchParams?.postpaid ? JSON?.parse(resolvedSearchParams?.postpaid) : {}
    const prepaidFilterBody = resolvedSearchParams?.prepaid ? JSON?.parse(resolvedSearchParams?.prepaid) : {}
    const { pageCount, data, totalCount, allData } = await fetchBillsInBatches({ ...filterBody, batch_id: id || '' })
    const { pageCount: prepaidPageCount, data: prepaidData, totalCount: prepaidTotalCount, allData: prepaidAllData } = await fetchRechargesInBatches({ ...prepaidFilterBody, batch_id: id || '' })
    const prepaidTotalAmount = prepaidAllData?.reduce((acc, curr) => acc + (curr.recharge_amount || 0), 0) || 0;
    const postpaidTotalAmount = allData?.reduce((acc, curr) => acc + (curr.approved_amount || 0), 0) || 0;
    const totalAmount = prepaidTotalAmount + postpaidTotalAmount;
    const isPaidCount = (allData || []).filter((bill: any) => bill.payment_status === true).length;
    const newBillCount = getNewBillCount(allData || [], 'postpaid')

    const batch = (allData && allData.length > 0 ? allData[0].batches : null) || scopedBatch;
    const historyItems = await buildBatchHistoryItems(batch)
    const isBatchExpired = isCalendarDateExpired(batch?.validate_at);

    const increasedAmountCount = (allData || []).filter(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date(new Date().setHours(0, 0, 0, 0));
        return bill.approved_amount != null &&
            getAfterDueAmount(bill) > bill.approved_amount &&
            bill.payment_status === false &&
            dueDate < today;
    }).length;

    const hasUnresolvedBillsCount = isPaidCount || newBillCount + increasedAmountCount;
    const hasPostpaid = (data?.length || 0) > 0;
    const hasPrepaid = (prepaidData?.length || 0) > 0;

    return (
        <div id="bill-batches" className="space-y-6">
            {id &&
                <BatchAction
                    batchCreatedAt={batch?.created_at || ''}
                    batchValidTill={batch?.validate_at || ''}
                    batchId={id || ''}
                    batchStatus={batch?.batch_status || ''}
                    totalAmount={totalAmount}
                    totalBills={totalCount}
                    totalRecharges={prepaidTotalCount}
                    totalBillsAmount={postpaidTotalAmount}
                    totalRechargesAmount={prepaidTotalAmount}
                    hasUnresolvedBillsCount={hasUnresolvedBillsCount}
                    isBatchExpired={isBatchExpired}
                />}
            {
                hasPostpaid && (
                    <BatchItemTable
                        payType="postpaid"
                        data={data}
                        initialBody={filterBody}
                        pageCount={pageCount}
                        totalCount={totalCount}
                    />
                )
            }
            {
                hasPrepaid && (
                    <BatchItemTable
                        payType="prepaid"
                        data={prepaidData}
                        initialBody={prepaidFilterBody}
                        pageCount={prepaidPageCount}
                        totalCount={prepaidTotalCount}
                    />
                )
            }
            {!hasPostpaid && !hasPrepaid && (
                <p className="text-sm text-muted-foreground">No bills found</p>
            )}
            <BatchHistoryTimeline items={historyItems} title="Batch Activity" />
        </div>
    )
}
