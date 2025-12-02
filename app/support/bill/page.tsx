import React from 'react';
import { fetchAllBills } from '@/services/bills';
import { SearchParamsProps } from '@/types';
import { AllBillTable } from '@/components/tables/bill/all-bill-table';

type paramsProps = {
  searchParams: Promise<SearchParamsProps>;
};

export default async function Page(props: paramsProps) {
  const searchParams = await props.searchParams;
  const { pageCount, data, totalCount } = await fetchAllBills(searchParams);
  return (
    <AllBillTable
      pageCount={pageCount}
      totalCount={totalCount}
      data={data}
    />
  );
}
