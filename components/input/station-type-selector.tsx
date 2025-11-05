'use client'
import React from 'react';
import { cn } from '@/lib/utils';
import { useSiteType } from '@/hooks/use-site-type';

interface StationTypeSelectorProps {
    value?: string[];
    onChange: (types: string[]) => void;
    className?: string;
}
export function StationTypeSelector({ value = [], onChange, className }: StationTypeSelectorProps) {
    const SITE_TYPES = useSiteType();
    const handleToggle = (type: string) => {
        const filteredValue = value.filter(v => v.trim() !== '');
        if (filteredValue.includes(type)) {
            onChange(filteredValue.filter(t => t !== type));
        } else {
            onChange([...filteredValue, type]);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap gap-2">
                {SITE_TYPES.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => handleToggle(type.value)}
                        className={cn(
                            "px-3 py-1 rounded-full transition-all text-sm font-medium",
                            "bg-white border hover:border-primary hover:bg-primary/5",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50",
                            value.filter(v => v.trim() !== '').includes(type.value)
                                ? "border-2 border-primary text-primary bg-primary/10"
                                : "border-gray-200 text-gray-700"
                        )}
                    >
                        {type.label}
                        {value.filter(v => v.trim() !== '').includes(type.value) && (
                            <span className="ml-1">✓</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}