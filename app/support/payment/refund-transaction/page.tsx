import React from 'react';
import { SearchParamsProps } from '@/types';
import { fetchRefundPaymentTransactions } from '@/services/payments';
import { RefundPaginationWrapper } from '@/components/refund/refund-pagination-wrapper';

type paramsProps = {
  searchParams: Promise<SearchParamsProps>;
};

export default async function page(props: paramsProps) {
  const searchParams = await props.searchParams;
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
