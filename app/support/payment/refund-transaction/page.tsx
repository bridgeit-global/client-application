import React from 'react';
import { SearchParamsProps } from '@/types';
import { fetchRefundPaymentTransactions } from '@/services/payments';
import { RefundPaginationWrapper } from '@/components/refund/refund-pagination-wrapper';

type paramsProps = {
  searchParams: SearchParamsProps;
};

export default async function page({ searchParams }: paramsProps) {
  const { data, totalCount, pageCount } = await fetchRefundPaymentTransactions(searchParams);

  return (
    <RefundPaginationWrapper
      data={data}
      totalCount={totalCount}
      pageCount={pageCount}
      searchParams={searchParams}
    />
  );
}
