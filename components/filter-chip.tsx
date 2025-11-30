'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { snakeToTitle } from '@/lib/utils/string-format';
import { useSiteName } from '@/lib/utils/site';
import { useSiteType } from '@/hooks/use-site-type';

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
  const siteTypes = useSiteType();
  
  // Get valid site type values
  const validSiteTypes = siteTypes.map(t => t.value.toLowerCase());
  
  // Auto-remove invalid 'type' filter values on mount and when filterBody changes
  useEffect(() => {
    if (filterBody.type && validSiteTypes.length > 0) {
      const typeValues = Array.isArray(filterBody.type) 
        ? filterBody.type 
        : filterBody.type.split(',').map((v: string) => v.trim());
      
      const validTypes = typeValues.filter((t: string) => 
        validSiteTypes.includes(t.toLowerCase())
      );
      
      // If no valid types remain or some were filtered out, update the filter
      if (validTypes.length === 0) {
        setFilterBody((prev) => {
          const newFilterBody = { ...prev, type: null };
          if (createQueryString) {
            router.push(`${pathname}?${createQueryString(newFilterBody)}`, { scroll: false });
          }
          return newFilterBody;
        });
      } else if (validTypes.length !== typeValues.length) {
        // Some invalid types were removed
        setFilterBody((prev) => {
          const newFilterBody = { ...prev, type: validTypes.join(',') };
          if (createQueryString) {
            router.push(`${pathname}?${createQueryString(newFilterBody)}`, { scroll: false });
          }
          return newFilterBody;
        });
      }
    }
  }, [filterBody.type, validSiteTypes.length]);

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

  // Check if a type value is valid
  const isValidTypeValue = (value: any): boolean => {
    if (!value || validSiteTypes.length === 0) return true; // Allow if still loading
    const typeValues = Array.isArray(value) 
      ? value 
      : String(value).split(',').map((v: string) => v.trim());
    return typeValues.some((t: string) => validSiteTypes.includes(t.toLowerCase()));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(filterBody).map(([key, value]) => {
        if (!value || key === 'limit' || key === 'page' || key === 'sort' || key === 'order') return null;
        
        // Skip displaying invalid type filters
        if (key === 'type' && !isValidTypeValue(value)) return null;

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
