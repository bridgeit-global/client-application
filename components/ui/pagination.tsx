'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    isLoading?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isLoading = false
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
                    <strong>{totalCount}</strong> results
                </p>
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                        onPageSizeChange(Number(value));
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    className="hidden h-8 w-8 p-0 lg:flex"
                >
                    <DoubleArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    {isLoading ? 'Loading...' : `Page ${currentPage} of ${totalPages}`}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    className="hidden h-8 w-8 p-0 lg:flex"
                >
                    <DoubleArrowRightIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
} 