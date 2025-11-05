import React from 'react';
import { PaymentUpdateTable } from '@/components/tables/payment/payment-update-table';
import { fetchRechargePaymentEdit } from '@/services/payments';
import { SearchParamsProps } from '@/types';
type paramsProps = {
  searchParams: SearchParamsProps;
};
export default async function page({ searchParams }: paramsProps) {
  const { pageCount, data, totalCount } = await fetchRechargePaymentEdit(searchParams);
  return (
    <PaymentUpdateTable
      type="recharge"
      initialBody={searchParams}
      pageCount={pageCount}
      totalCount={totalCount}
      data={data}
    />
  );
}
