import React from 'react';
import { SearchParamsProps } from '@/types';
import { fetchPaymentGatewayTransactions } from '@/services/payments';
import { TransactionTable } from '@/components/tables/payment/transaction-table';
type paramsProps = {
  searchParams: SearchParamsProps;
};

export default async function page({ searchParams }: paramsProps) {
  const status = 'pending';
  const filterBody = searchParams[status] ? JSON?.parse(searchParams[status]) : {};
  const { pageCount, data, totalCount } = await fetchPaymentGatewayTransactions(filterBody, { status });
  return (
    <TransactionTable
      initialBody={filterBody}
      status={status}
      pageCount={pageCount}
      totalCount={totalCount}
      data={data}
    />
  );
}
