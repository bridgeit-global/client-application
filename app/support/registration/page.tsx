import React from 'react';
import { RegistrationTable } from '@/components/tables/connection/registration-table';
import { fetchRegistrations } from '@/services/registrations';
import { SearchParamsProps } from '@/types';

type paramsProps = {
  searchParams: SearchParamsProps;
};

export default async function page({ searchParams }: paramsProps) {

  const filterBody = searchParams?.filter
    ? JSON?.parse(searchParams?.filter)
    : {};
  const { pageCount, data, totalCount } =
    await fetchRegistrations(filterBody);
  return (
    <div id="failed_registration">
      <RegistrationTable
        initialBody={filterBody}
        pageCount={pageCount}
        totalCount={totalCount}
        data={data}
      />
    </div>
  );
}
