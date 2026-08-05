import React from 'react';
import { RegistrationTable } from '@/components/tables/connection/registration-table';
import { fetchRegistrations } from '@/services/registrations';
import { SearchParamsProps } from '@/types';

type paramsProps = {
  searchParams: Promise<SearchParamsProps>;
};

// Request-scoped page; also avoids the useSearchParams prerender bailout.
export const dynamic = 'force-dynamic';

export default async function page(props: paramsProps) {
  const searchParams = await props.searchParams;

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
