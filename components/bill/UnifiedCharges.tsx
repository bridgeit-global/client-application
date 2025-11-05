'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { snakeToTitle } from '@/lib/utils/string-format';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ChargeType {
    [key: string]: number | string;
}

interface ChargesState {
    core: ChargeType;
    regulatory: ChargeType;
    adherence: ChargeType;
    additional: ChargeType;
}

interface ZeroField {
    name: string;
    category: keyof ChargesState;
}

interface UnifiedChargesProps {
    coreCharges?: ChargeType;
    regulatoryCharges?: ChargeType;
    adherenceCharges?: ChargeType;
    additionalCharges?: ChargeType;
    onChargesChange?: (charges: ChargesState) => void;
    disabled?: boolean;
    shouldReset?: boolean;
}

export function UnifiedCharges({
    coreCharges = {},
    regulatoryCharges = {},
    adherenceCharges = {},
    additionalCharges = {},
    onChargesChange,
    disabled,
    shouldReset
}: UnifiedChargesProps) {
    const [charges, setCharges] = useState<ChargesState>({
        core: filterValidCharges(coreCharges),
        regulatory: filterValidCharges(regulatoryCharges),
        adherence: filterValidCharges(adherenceCharges),
        additional: filterValidCharges(additionalCharges)
    });

    // Initialize checkedFields with all active charge fields
    const [checkedFields, setCheckedFields] = useState<Set<string>>(() => {
        const initialCheckedFields = new Set<string>();
        Object.entries({
            core: filterValidCharges(coreCharges),
            regulatory: filterValidCharges(regulatoryCharges),
            adherence: filterValidCharges(adherenceCharges),
            additional: filterValidCharges(additionalCharges)
        }).forEach(([category, fields]) => {
            Object.keys(fields).forEach(field => {
                initialCheckedFields.add(`${category}-${field}`);
            });
        });
        return initialCheckedFields;
    });

    const [removedFields, setRemovedFields] = useState<ZeroField[]>([]);

    // Reset effect
    useEffect(() => {
        if (shouldReset) {
            const newCharges = {
                core: filterValidCharges(coreCharges),
                regulatory: filterValidCharges(regulatoryCharges),
                adherence: filterValidCharges(adherenceCharges),
                additional: filterValidCharges(additionalCharges)
            };
            setCharges(newCharges);

            // Initialize checkedFields with all active charge fields
            const initialCheckedFields = new Set<string>();
            Object.entries(newCharges).forEach(([category, fields]) => {
                Object.keys(fields).forEach(field => {
                    initialCheckedFields.add(`${category}-${field}`);
                });
            });
            setCheckedFields(initialCheckedFields);
            setRemovedFields([]);
        }
    }, [shouldReset, coreCharges, regulatoryCharges, adherenceCharges, additionalCharges]);

    function filterValidCharges(charges: ChargeType | null | undefined): ChargeType {
        return Object.fromEntries(
            Object.entries(charges || {})
                .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value !== 0 &&
                    !['created_at', 'updated_at', 'id'].includes(key)
                )
        );
    }

    const getAvailableFields = useCallback(() => {
        // Get all fields currently in use across all charge categories
        const allUsedFields = new Set(
            Object.values(charges).flatMap(category => Object.keys(category))
        );

        // Get all fields from original charges that have zero values
        const originalCharges = {
            core: coreCharges,
            regulatory: regulatoryCharges,
            adherence: adherenceCharges,
            additional: additionalCharges
        };

        const zeroFields: ZeroField[] = [];

        // Add fields from original charges with zero values
        Object.entries(originalCharges).forEach(([category, categoryCharges]) => {
            Object.entries(categoryCharges || {}).forEach(([key, value]) => {
                if (typeof value === 'number' && value === 0 && !['created_at', 'updated_at', 'id'].includes(key)) {
                    zeroFields.push({
                        name: key,
                        category: category as keyof ChargesState
                    });
                }
            });
        });

        // Add removed fields
        removedFields.forEach(field => {
            if (!allUsedFields.has(field.name)) {
                zeroFields.push(field);
            }
        });

        // Remove duplicates and fields that are currently in use
        return Array.from(
            new Map(zeroFields.map(field => [field.name, field])).values()
        ).filter(field => !allUsedFields.has(field.name));
    }, [charges, coreCharges, regulatoryCharges, adherenceCharges, additionalCharges, removedFields]);

    const handleChange = (category: keyof ChargesState, field: string, value: string) => {
        if (value === '') {
            setCharges(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [field]: 0
                }
            }));
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setCharges(prev => ({
                    ...prev,
                    [category]: {
                        ...prev[category],
                        [field]: numValue
                    }
                }));
            }
        }
    };

    const toggleField = (category: keyof ChargesState, field: string, checked: boolean) => {
        const fieldKey = `${category}-${field}`;

        if (checked) {
            setCheckedFields(prev => new Set(Array.from(prev).concat([fieldKey])));
        } else {
            setCheckedFields(prev => {
                const newSet = new Set(Array.from(prev));
                newSet.delete(fieldKey);
                return newSet;
            });
        }
    };

    const addNewField = (fieldName: string, category: keyof ChargesState) => {
        setCharges(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [fieldName]: 0
            }
        }));
        // Automatically check new fields
        setCheckedFields(prev => new Set(Array.from(prev).concat([`${category}-${fieldName}`])));
    };

    // Notify parent of changes with both active and zero-value fields
    useEffect(() => {
        if (onChargesChange) {
            const allCharges: ChargesState = {
                core: {},
                regulatory: {},
                adherence: {},
                additional: {}
            };

            // Add all fields with their values, using 0 for unchecked fields
            Object.entries(charges).forEach(([category, categoryCharges]) => {
                Object.entries(categoryCharges).forEach(([key, value]) => {
                    const fieldKey = `${category}-${key}`;
                    if (checkedFields.has(fieldKey)) {
                        allCharges[category as keyof ChargesState][key] = value as number;
                    } else {
                        allCharges[category as keyof ChargesState][key] = 0;
                    }
                });
            });

            // Add zero-value fields from original charges
            const originalCharges = {
                core: coreCharges,
                regulatory: regulatoryCharges,
                adherence: adherenceCharges,
                additional: additionalCharges
            };

            Object.entries(originalCharges).forEach(([category, categoryCharges]) => {
                Object.entries(categoryCharges || {}).forEach(([key, value]) => {
                    const typedCategory = category as keyof ChargesState;
                    if (
                        typeof value === 'number' &&
                        !['created_at', 'updated_at', 'id'].includes(key) &&
                        !allCharges[typedCategory][key]
                    ) {
                        allCharges[typedCategory][key] = 0;
                    }
                });
            });

            onChargesChange(allCharges);
        }
    }, [charges, checkedFields, onChargesChange, coreCharges, regulatoryCharges, adherenceCharges, additionalCharges]);

    // Get all active charges as a flat list for rendering
    const getAllActiveCharges = () => {
        const activeCharges: Array<{ name: string; value: number; category: keyof ChargesState }> = [];
        Object.entries(charges).forEach(([category, fields]) => {
            Object.entries(fields).forEach(([name, value]) => {
                activeCharges.push({
                    name,
                    value: value as number,
                    category: category as keyof ChargesState
                });
            });
        });
        return activeCharges;
    };

    const availableFields = getAvailableFields();
    const activeCharges = getAllActiveCharges();

    return (
        <div className="space-y-3 p-4">
            {activeCharges.map((charge, index) => (
                <div key={`${charge.category}-${charge.name}`} className="flex gap-4 items-center">
                    <div className="flex-1 space-y-2">
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                            {snakeToTitle(charge.name).toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={typeof charge.value === 'number' && !isNaN(charge.value) ? String(charge.value) : ''}
                            onChange={(e) => {
                                // Allow only valid decimal input (including trailing dot/zeroes)
                                const val = e.target.value;
                                // Accept empty, or valid decimal, or just a dot
                                if (
                                    val === '' ||
                                    /^-?\d*\.?\d*$/.test(val)
                                ) {
                                    handleChange(charge.category, charge.name, val);
                                }
                            }}
                            disabled={disabled || !checkedFields.has(`${charge.category}-${charge.name}`)}
                            placeholder="Enter value"
                        />
                    </div>
                    <Checkbox
                        id={`${charge.category}-${charge.name}`}
                        checked={checkedFields.has(`${charge.category}-${charge.name}`)}
                        onCheckedChange={(checked) => toggleField(charge.category, charge.name, checked as boolean)}
                        disabled={disabled}
                    />
                </div>
            ))}

            {availableFields.length > 0 && (
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label>Add New Field</Label>
                        <Select
                            onValueChange={(value) => {
                                const field = availableFields.find(f => f.name === value);
                                if (field) {
                                    addNewField(field.name, field.category);
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {availableFields.map(field => (
                                    <SelectItem key={field.name} value={field.name}>
                                        {snakeToTitle(field.name).toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1" />
                    <div className="w-[200px]" />
                </div>
            )}
        </div>
    );
} 