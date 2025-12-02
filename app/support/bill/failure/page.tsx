import React from 'react';
import { SearchParamsProps } from '@/types';
import { FailureReportTable } from '@/components/tables/report/failure-report';
import { fetchFailureReport } from '@/services/reports';

type paramsProps = {
  searchParams: Promise<SearchParamsProps>;
};

export default async function page(props: paramsProps) {
  const searchParams = await props.searchParams;

  const filterBody = searchParams?.filter
    ? JSON?.parse(searchParams?.filter)
    : {};

  const combinedParams = {
    ...filterBody,
    page: searchParams?.page || 1,
    limit: searchParams?.limit || 10
  };

  const { pageCount, data, totalCount } =
    await fetchFailureReport(combinedParams);
  return (
    <FailureReportTable
      initialBody={combinedParams}
      pageCount={pageCount}
      totalCount={totalCount}
      data={data}
    />
  );
}
