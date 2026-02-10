'use client'
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteType } from '@/hooks/use-site-type';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface StationTypeSelectorProps {
    value?: string[];
    onChange: (types: string[]) => void;
    className?: string;
}

export function StationTypeSelector({ value = [], onChange, className }: StationTypeSelectorProps) {
    const SITE_TYPES = useSiteType();
    const filteredValue = value.filter((v) => v.trim() !== '');

    const handleCheckedChange = (type: string, checked: boolean) => {
        if (checked) {
            onChange([...filteredValue, type]);
        } else {
            onChange(filteredValue.filter((t) => t !== type));
        }
    };

    const triggerLabel =
        filteredValue.length === 0
            ? 'Station type'
            : filteredValue.length === 1
              ? SITE_TYPES.find((t) => t.value === filteredValue[0])?.label ?? filteredValue[0]
              : `${filteredValue.length} types selected`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'min-w-[10rem] h-9 justify-between font-normal rounded-md border border-input',
                        className
                    )}
                >
                    <span className="truncate">{triggerLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {SITE_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                        key={type.value}
                        checked={filteredValue.includes(type.value)}
                        onCheckedChange={(checked) => handleCheckedChange(type.value, checked === true)}
                    >
                        {type.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}