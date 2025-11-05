'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { snakeToTitle } from '@/lib/utils/string-format';

interface CustomField {
    name: string;
    value: string;
    category?: string;
}

interface CustomFieldsProps {
    zeroValueKeys: string[];
    onCustomFieldsChange?: (fields: { [key: string]: { [key: string]: number } }) => void;
    coreCharges?: any;
    regulatoryCharges?: any;
    adherenceCharges?: any;
    additionalCharges?: any;
    disabled?: boolean;
    shouldReset?: boolean;
}

export function CustomFields({
    zeroValueKeys,
    onCustomFieldsChange,
    coreCharges,
    regulatoryCharges,
    adherenceCharges,
    additionalCharges,
    disabled,
    shouldReset
}: CustomFieldsProps) {
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    // Reset effect
    useEffect(() => {
        if (shouldReset) {
            setCustomFields([]);
        }
    }, [shouldReset]);

    // Check if the last field is filled
    const isLastFieldFilled = () => {
        if (customFields.length === 0) return true;
        const lastField = customFields[customFields.length - 1];
        return lastField.name !== '' && lastField.value !== '';
    };

    // Determine which category a field belongs to
    const getFieldCategory = useCallback((fieldName: string) => {
        if (coreCharges && fieldName in coreCharges) return 'core';
        if (regulatoryCharges && fieldName in regulatoryCharges) return 'regulatory';
        if (adherenceCharges && fieldName in adherenceCharges) return 'adherence';
        if (additionalCharges && fieldName in additionalCharges) return 'additional';
        return '';
    }, [coreCharges, regulatoryCharges, adherenceCharges, additionalCharges]);

    // Get list of already selected keys (excluding the current field)
    const getSelectedKeys = (currentIndex: number) => {
        return customFields
            .filter((_, idx) => idx !== currentIndex)
            .map(field => field.name)
            .filter(name => name !== '');
    };

    // Get available keys for a specific field
    const getAvailableKeys = (currentIndex: number) => {
        const selectedKeys = getSelectedKeys(currentIndex);
        return zeroValueKeys.filter(key => !selectedKeys.includes(key));
    };

    const addField = () => {
        setCustomFields(prev => [...prev, { name: '', value: '', category: '' }]);
    };

    const removeField = (index: number) => {
        setCustomFields(prev => prev.filter((_, i) => i !== index));
    };

    const updateField = (index: number, field: 'name' | 'value', value: string) => {
        setCustomFields(prev => {
            const newFields = [...prev];
            if (field === 'name') {
                newFields[index] = {
                    ...newFields[index],
                    [field]: value,
                    category: getFieldCategory(value)
                };
            } else {
                newFields[index] = {
                    ...newFields[index],
                    [field]: value
                };
            }
            return newFields;
        });
    };

    // Notify parent of changes
    const notifyChanges = useCallback(() => {
        if (!onCustomFieldsChange) return;

        const validFields = customFields.filter(field => field.name && field.value && field.category);
        const groupedFields = validFields.reduce((acc, field) => {
            if (!field.category) return acc;

            if (!acc[field.category]) {
                acc[field.category] = {};
            }
            acc[field.category][field.name] = parseFloat(field.value);
            return acc;
        }, {} as { [key: string]: { [key: string]: number } });

        onCustomFieldsChange(groupedFields);
    }, [customFields, onCustomFieldsChange]);

    // Update parent when fields change
    useEffect(() => {
        notifyChanges();
    }, [notifyChanges]);

    return (
        <div className="space-y-4">
            {customFields.map((field, index) => (
                <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor={`field-name-${index}`}>Field Name</Label>
                        <Select
                            value={field.name}
                            onValueChange={(value) => updateField(index, 'name', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a field name" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {getAvailableKeys(index).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {snakeToTitle(key).toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label htmlFor={`field-value-${index}`}>Value</Label>
                        <Input
                            id={`field-value-${index}`}
                            value={field.value}
                            type="number"
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            placeholder="Enter value"
                            disabled={disabled}
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(index)}
                        disabled={disabled}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={addField}
                    className="flex items-center gap-2"
                    disabled={!isLastFieldFilled() || disabled}
                >
                    <Plus className="h-4 w-4" />
                    Add Field
                </Button>
            </div>
        </div>
    );
}