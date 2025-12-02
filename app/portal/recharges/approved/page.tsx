import { PrepaidBatchRecommendations } from '@/components/recommendations/PrepaidBatchRecommendations';
import PrepaidApprovedTable from '@/components/tables/bill/prepaid-approved-table';
import { fetchApprovedPrepaidRecharges, fetchRechargeRecommendations } from '@/services/bills';
import { SearchParamsProps } from '@/types';
export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchApprovedPrepaidRecharges(searchParams);
  const recommendationData = await fetchRechargeRecommendations();
  return (
    <div className="flex flex-col space-y-6">
      {recommendationData ?
        <PrepaidBatchRecommendations
          nextSevenDaysRechargesData={recommendationData.nextSevenDaysRechargesData || []}
          totalRechargesData={recommendationData.totalRechargesData || []}
          currentDueRechargesData={recommendationData.currentDueRechargesData || []}
        /> : null}
      <PrepaidApprovedTable
        data={data}
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div >
  );
}
