
import { getNewBillCount } from "@/lib/utils/bill"
import { fetchBillsInBatches, fetchRechargesInBatches } from "@/services/batches"
import type { SearchParamsProps } from "@/types"
import { getAfterDueAmount } from '@/lib/utils';
import { BatchItemTable } from "@/components/tables/batch/batch-item-table"
import BatchAction from "@/components/tables/batch/batch-item-table/batch-action"
import BatchHistoryTimeline from "@/components/batch/batch-history-timeline"
import { BatchFundsOverviewCard } from "@/components/cards/batch-fund-overview-card";

export default async function Page({
    searchParams,
    params,
}: {
    searchParams: SearchParamsProps,
    params: { id: string }
}) {
    const filterBody = searchParams?.postpaid ? JSON?.parse(searchParams?.postpaid) : {}
    const prepaidFilterBody = searchParams?.prepaid ? JSON?.parse(searchParams?.prepaid) : {}
    const { pageCount, data, totalCount, allData } = await fetchBillsInBatches({ ...filterBody, batch_id: params?.id || '' })
    const { pageCount: prepaidPageCount, data: prepaidData, totalCount: prepaidTotalCount, allData: prepaidAllData } = await fetchRechargesInBatches({ ...prepaidFilterBody, batch_id: params?.id || '' })
    const prepaidTotalAmount = prepaidAllData?.reduce((acc, curr) => acc + (curr.recharge_amount || 0), 0) || 0;
    const postpaidTotalAmount = allData?.reduce((acc, curr) => acc + (curr.approved_amount || 0), 0) || 0;
    const totalAmount = prepaidTotalAmount + postpaidTotalAmount;
    const isPaidCount = (allData || []).filter((bill: any) => bill.payment_status === true).length;
    const newBillCount = getNewBillCount(allData || [], 'postpaid')

    const batch = allData && allData.length > 0 ? allData[0].batches : null;
    let historyItems = Array.isArray(batch?.user_actions)
        ? (batch?.user_actions as any[]).map((u: any) => ({
            action: u?.action || 'updated',
            user_id: u?.user_id || '',
            status_to: u?.status_to || batch?.batch_status || 'unpaid',
            status_from: u?.status_from ?? undefined,
            timestamp: u?.timestamp || u?.created_at || batch?.created_at || new Date().toISOString(),
            note: u?.note || null
        }))
        : []

    if ((historyItems?.length || 0) === 0 && batch) {
        historyItems = [{
            action: 'created',
            user_id: batch?.created_by || '',
            status_to: 'unpaid',
            status_from: null,
            timestamp: batch?.created_at || new Date().toISOString(),
            note: batch?.batch_name ? `Batch "${batch.batch_name}" created` : null
        }]
    }
    let isBatchExpired = false;
    let batchExpiryDate: Date | null = null;
    if (batch && batch.validate_at) {
        batchExpiryDate = new Date(batch.validate_at);
        isBatchExpired = new Date(new Date().setHours(0, 0, 0, 0)) > batchExpiryDate;
    }

    const increasedAmountCount = (allData || []).filter(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date(new Date().setHours(0, 0, 0, 0));
        return bill.approved_amount != null &&
            getAfterDueAmount(bill) > bill.approved_amount &&
            bill.payment_status === false &&
            dueDate < today;
    }).length;

    const hasUnresolvedBillsCount = isPaidCount || newBillCount + increasedAmountCount;

    if (data.length === 0 && prepaidPageCount === 0) {
        return <p>No bills found</p>
    }

    return (
        <div id="bill-batches" className="space-y-6">
            <BatchFundsOverviewCard />
            {params?.id &&
                <BatchAction
                    batchCreatedAt={batch?.created_at || ''}
                    batchValidTill={batch?.validate_at || ''}
                    batchId={params?.id || ''}
                    batchStatus={batch?.batch_status || ''}
                    totalAmount={totalAmount}
                    totalBills={totalCount}
                    totalRecharges={prepaidTotalCount}
                    totalBillsAmount={postpaidTotalAmount}
                    totalRechargesAmount={prepaidTotalAmount}
                    hasUnresolvedBillsCount={hasUnresolvedBillsCount}
                    isBatchExpired={isBatchExpired}
                />}
            {/* Batch history demo; replace with real data when available */}
            {
                data.length > 0 && (
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
                prepaidData.length > 0 && (
                    <BatchItemTable
                        payType="prepaid"
                        data={prepaidData}
                        initialBody={prepaidFilterBody}
                        pageCount={prepaidPageCount}
                        totalCount={prepaidTotalCount}
                    />
                )
            }
            <BatchHistoryTimeline items={historyItems} title="Batch Activity" />
        </div>
    )

}

