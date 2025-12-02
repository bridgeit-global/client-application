
import { fetchBillsInBatches, fetchRechargesInBatches } from "@/services/batches"
import type { SearchParamsProps } from "@/types"
import { BatchItemTable } from "@/components/tables/batch/batch-item-table"

export default async function Page(
    props: {
        searchParams: Promise<SearchParamsProps>
    }
) {
    const searchParams = await props.searchParams;
    const filterBody = searchParams?.postpaid ? JSON?.parse(searchParams?.postpaid) : {}
    const prepaidFilterBody = searchParams?.prepaid ? JSON?.parse(searchParams?.prepaid) : {}
    const { pageCount, data, totalCount } = await fetchBillsInBatches(filterBody)
    const { pageCount: prepaidPageCount, data: prepaidData, totalCount: prepaidTotalCount } = await fetchRechargesInBatches(prepaidFilterBody)
    return (
        <div id="bill-batches" className="space-y-6">
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
        </div>
    )
}

