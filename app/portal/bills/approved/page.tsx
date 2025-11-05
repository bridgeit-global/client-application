import { BatchRecommendations } from '@/components/recommendations/BatchRecommendations';
import ApprovedBillTable from '@/components/tables/bill/approved-bill-table';
import { fetchApprovedPostpaidBills, fetchBillRecommendations } from '@/services/bills';
import { SearchParamsProps } from '@/types';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParamsProps;
}) {
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
      <ApprovedBillTable
        totalAmount={0}
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  );
}
