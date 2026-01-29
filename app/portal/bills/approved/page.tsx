import { BatchRecommendations } from '@/components/recommendations/BatchRecommendations';
import ApprovedBillTable from '@/components/tables/bill/approved-bill-table';
import { fetchApprovedPostpaidBills, fetchBillRecommendations } from '@/services/bills';
import { SearchParamsProps } from '@/types';
import { BatchTip } from '@/components/batch/batch-workflow-guide';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchApprovedPostpaidBills(searchParams);
  const recommendationData = await fetchBillRecommendations();
  return (
    <div className="flex flex-col space-y-6">
      <BatchRecommendations
        totalBillsData={recommendationData.totalBillsData || []}
        overdueBillsData={recommendationData.overdueBillsData || []}
        discountDateBillsData={recommendationData.discountDateBillsData || []}
        currentDueBillsData={recommendationData.currentDueBillsData || []}
        nextSevenDaysBillsData={recommendationData.nextSevenDaysBillsData || []}
      />
      
      {/* Show tip only when there are bills but no recommendations clicked */}
      {data.length > 0 && <BatchTip />}
      
      <ApprovedBillTable
        totalAmount={0}
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
