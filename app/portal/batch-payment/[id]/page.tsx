import { BillBatchPaymentTable } from "@/components/tables/payment/bill-batch-payment-table"
import { fetchBillPayments } from "@/services/payments"
import type { SearchParamsProps } from "@/types"
import { filterIncreaseAmountRecords } from "@/lib/utils"

export default async function Page({
    searchParams,
    params,
}: {
    searchParams: SearchParamsProps
    params: SearchParamsProps
}) {
    const { id } = params
    if (id) {
        const { pageCount, data, totalCount, allBills } = await fetchBillPayments(searchParams, { batch_id: id });
        const increaseAmountRecords = filterIncreaseAmountRecords(allBills);
        return (
            <BillBatchPaymentTable allBills={allBills || []} increaseAmountRecords={increaseAmountRecords} batchId={id} data={data} initialBody={searchParams} pageCount={pageCount} totalCount={totalCount} />
        )
    }

    return <div>Batch ID Not Found</div>
}

