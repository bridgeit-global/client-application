import React from 'react';
import { SearchParamsProps } from '@/types';
import { BillPaymentTable } from '@/components/tables/payment/bill-payment-table/index';
import { fetchBillPayments } from '@/services/payments';
type paramsProps = {
  searchParams: SearchParamsProps;
};

export default async function page({ searchParams }: paramsProps) {
  const { pageCount, data, totalCount } = await fetchBillPayments(searchParams);
  return (
    <BillPaymentTable
      pageCount={pageCount}
      totalCount={totalCount}
      data={data}
    />
  );
}
