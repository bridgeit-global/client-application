'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { snakeToTitle } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';

interface FilterChipsProps {
  filterBody: Record<string, any>;
  setFilterBody: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  fetchData?: () => void;
  createQueryString?: (
    params: Record<string, string | number | null | boolean>
  ) => string;
}

export default function FilterChips({
  filterBody,
  setFilterBody,
  fetchData,
  createQueryString
}: FilterChipsProps) {
  const { billers } = useBillerBoardStore();
  const router = useRouter();
  const pathname = usePathname();
  const site_name = useSiteName();

  const STATUS_MAPPINGS = {
    is_active: {
      '0': `Inactive ${site_name}`,
      '1': `Active ${site_name}`
    },
    lag_type: {
      '0': 'Over 10 Days',
      '1': '6-10 Days',
      '2': '0-5 Days'
    },
    pay_type: {
      '0': 'Prepaid',
      '1': 'Postpaid',
      '-1': 'Submeter'
    },
    is_arrear: {
      'true': 'Positive Arrear',
      'false': 'Negative Arrear'
    },
    is_penalty: {
      'true': 'Yes',
      'false': 'No'
    },
    bill_category: {
      overdue: "Overdue",
      seven_day: "Next 7 Days",
      next_seven_day: "7-14 Days",
    }
  } as const;

  const handleDelete = (key: string) => {
    setFilterBody((prev) => {
      const newFilterBody = { ...prev, [key]: null };
      if (createQueryString) {
        router.push(`${pathname}?${createQueryString(newFilterBody)}`, { scroll: false });
      }
      return newFilterBody;
    });
    fetchData?.();
  };

  const getDisplayValue = (key: string, value: any): string => {
    if (key === 'period') {
      return value === 'custom' ? 'Custom' : `Last ${value > 1 ? `${value} Months` : 'Month'}`;
    }
    if (key === 'type') {
      return Array.isArray(value) ? value.map((v: string) => v.toUpperCase()).join(', ') : value.toUpperCase();
    }
    if (key === 'biller_id') {
      const getBillerName = (id: string) => billers.find((e) => e.alias === id)?.board_name ?? id;
      return Array.isArray(value)
        ? value.map(getBillerName).join(', ')
        : getBillerName(value);
    }

    if (key === 'status') return STATUS_MAPPINGS.is_active[value as keyof typeof STATUS_MAPPINGS.is_active] ?? value;
    if (key === 'pay_type') return STATUS_MAPPINGS.pay_type[value as keyof typeof STATUS_MAPPINGS.pay_type] ?? value;
    if (key === 'is_arrear') return STATUS_MAPPINGS.is_arrear[value as keyof typeof STATUS_MAPPINGS.is_arrear] ?? value;
    if (key === 'penalty') {
      const penaltyMap = {
        lpsc: 'LPSC',
        tod_surcharge: 'TOD Surcharge',
        low_pf_surcharge: 'Low PF Surcharge',
        sanctioned_load_penalty: 'Sanctioned Load Penalty',
        power_factor_penalty: 'Power Factor Penalty',
        capacitor_surcharge: 'Capacitor Surcharge',
        misuse_surcharge: 'Misuse Surcharge'
      }
      return value.split(',').map((v: string) => penaltyMap[v as keyof typeof penaltyMap]).join(', ');
    }
    if (key === 'bill_category') return STATUS_MAPPINGS.bill_category[value as keyof typeof STATUS_MAPPINGS.bill_category] ?? value;
    if (key === 'dlq_type') {
      const dlqTypeMap = {
        'registration-dlq': 'Registration Failure',
        'activation-dlq': 'Bill Download Failure',
        'payment-dlq': 'Payment Failure',
        'pdf-dlq': 'Extraction Failure'
      };
      return dlqTypeMap[value as keyof typeof dlqTypeMap] ?? value;
    }

    return String(value);
  };

  const getDisplayKey = (key: string): string => {
    if (key === 'biller_id') return 'Biller Board';
    if (key === 'site_id') return snakeToTitle(`${site_name}_id`);
    if (key === 'dlq_type') return 'Failure Type';
    return snakeToTitle(key);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(filterBody).map(([key, value]) => {
        if (!value || key === 'limit' || key === 'page' || key === 'sort' || key === 'order') return null;

        return (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleDelete(key)}
          >
            {getDisplayKey(key)}: {getDisplayValue(key, value)}
            <X className="h-3 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
