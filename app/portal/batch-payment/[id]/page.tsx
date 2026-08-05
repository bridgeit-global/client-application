import { BillBatchPaymentTable } from "@/components/tables/payment/bill-batch-payment-table"
import { fetchBillPayments } from "@/services/payments"
import type { SearchParamsProps } from "@/types"
import { filterIncreaseAmountRecords } from "@/lib/utils"

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function Page(
    props: {
        searchParams: Promise<SearchParamsProps>
        params: Promise<SearchParamsProps>
    }
) {
    const params = await props.params;
    const searchParams = await props.searchParams;
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

