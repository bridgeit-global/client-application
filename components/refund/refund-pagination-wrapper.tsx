'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RefundPaymentTransactionsProps } from '@/types/payments-type';
import { RefundPaymentTransactionsCardsGrid } from '@/components/cards/refund-amount-cards-grid';
import { Pagination } from '@/components/ui/pagination';
import { createQueryString } from '@/lib/createQueryString';
import { SearchParamsProps } from '@/types';

interface RefundPaginationWrapperProps {
  data: RefundPaymentTransactionsProps[];
  totalCount: number;
  pageCount: number;
  searchParams: SearchParamsProps;
}

export function RefundPaginationWrapper({
  data,
  totalCount,
  pageCount,
  searchParams
}: RefundPaginationWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Get current page and page size from search params
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.limit) || 10;

  // Filter out undefined values from searchParams
  const filteredSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;

  const handlePageChange = (page: number) => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(urlSearchParams, {
        ...filteredSearchParams,
        page: page.toString(),
        limit: pageSize.toString()
      })}${currentHash}`,
      { scroll: false }
    );
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setIsLoading(true);
    const currentHash = window.location.hash;
    router.push(
      `${pathname}?${createQueryString(urlSearchParams, {
        ...filteredSearchParams,
        page: '1', // Reset to first page when changing page size
        limit: newPageSize.toString()
      })}${currentHash}`,
      { scroll: false }
    );
  };

  // Reset loading state when data changes
  useEffect(() => {
    if (data.length > 0) {
      setIsLoading(false);
    }
  }, [data]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-1 justify-between gap-2">
        <div className="flex gap-2">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-2xl font-medium">
              Refund Management
            </h2>
            <p className="text-muted-foreground">
              Manage wallet ledger records that require transaction ID updates
            </p>
          </div>
        </div>
      </div>
      <RefundPaymentTransactionsCardsGrid
        data={data}
        isLoading={isLoading}
      />

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 