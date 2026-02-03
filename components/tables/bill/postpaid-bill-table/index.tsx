'use client';

import Calendar from '@/components/calendar';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import { BillsProps } from '@/types/bills-type';
import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createQueryString } from '@/lib/createQueryString';
import { createClient } from '@/lib/supabase/client';
type DataTableProps = {
  data: BillsProps[];
};

export default function PostpaidBillTable({
  data,
}: DataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());
  const [filterBody, setFilterBody] = useState<Record<string, string>>(params);
  const sectionDetails = {
    status: "all",
    type: "postpaid"
  };

  // get user station type
  const supabase = createClient();
  const getUser = async () => {
    if (filterBody.type) {
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.site_type ?? user?.user_metadata?.station_type) {
      setFilterBody({ ...filterBody, type: (user?.user_metadata?.site_type ?? user?.user_metadata?.station_type) } as any);
    }
  }
  useEffect(() => {
    getUser();
  }, []);

  const onChangeSelectHandle = (key: string, value: string | string[]) => {
    setFilterBody((prev: any) => ({
      ...prev,
      [key]: Array.isArray(value) ? value.join(',') : value
    }));
  };
  useEffect(() => {
    const currentHash = window.location.hash;
    const newQueryString = createQueryString(searchParams, filterBody);
    const currentQueryString = searchParams.toString();
    
    // Only navigate if the query string actually changed
    if (newQueryString !== currentQueryString) {
      router.push(
        `${pathname}?${newQueryString}${currentHash}`,
        {
          scroll: false
        }
      );
    }
  }, [filterBody, pathname, router]);

  return (
    <div className="w-full">
      <div className="text-2xl font-medium mb-4">
        All Bills
      </div>
      <div className="my-2">
        <StationTypeSelector
          value={Array.isArray(filterBody?.type) ? filterBody.type : filterBody?.type?.split(',') || []}
          onChange={(types) => onChangeSelectHandle("type", types)}
        />
      </div>
      <Calendar billsData={data} sectionDetails={sectionDetails} />
    </div>
  );
}
