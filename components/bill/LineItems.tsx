import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { snakeToTitle } from '@/lib/utils/string-format';
import { useState, useEffect } from 'react';

interface ChargeType {
    [key: string]: number | string;
}

interface ChargesState {
    core: ChargeType;
    regulatory: ChargeType;
    adherence: ChargeType;
    additional: ChargeType;
}

interface LineItemsProps {
    coreCharges?: ChargeType;
    regulatoryCharges?: ChargeType;
    adherenceCharges?: ChargeType;
    additionalCharges?: ChargeType;
    onChargesChange?: (charges: ChargesState) => void;
    disabled?: boolean;
}

export function LineItems({
    coreCharges,
    regulatoryCharges,
    adherenceCharges,
    additionalCharges,
    onChargesChange,
    disabled
}: LineItemsProps) {

    const [charges, setCharges] = useState<ChargesState>({
        core: Object.fromEntries(
            Object.entries(coreCharges || {})
                .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value > 0 &&
                    !['created_at', 'updated_at', 'id'].includes(key)
                )
        ) as ChargeType,
        regulatory: Object.fromEntries(
            Object.entries(regulatoryCharges || {})
                .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value > 0 &&
                    !['created_at', 'updated_at', 'id'].includes(key)
                )
        ) as ChargeType,
        adherence: Object.fromEntries(
            Object.entries(adherenceCharges || {})
                .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value > 0 &&
                    !['created_at', 'updated_at', 'id'].includes(key)
                )
        ) as ChargeType,
        additional: Object.fromEntries(
            Object.entries(additionalCharges || {})
                .filter(([key, value]) =>
                    typeof value === 'number' &&
                    value > 0 &&
                    !['created_at', 'updated_at', 'id'].includes(key)
                )
        ) as ChargeType
    });

    useEffect(() => {
        if (onChargesChange) {
            onChargesChange(charges);
        }
    }, [charges, onChargesChange]);

    const handleChange = (category: keyof ChargesState, field: string, value: string) => {
        const numValue = parseFloat(value);
        setCharges(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                ...(numValue !== 0 ? { [field]: numValue } : {})
            }
        }));
    };

    const renderChargeFields = (category: keyof ChargesState, chargeObject: ChargeType) => {
        return Object.entries(chargeObject || {}).map(([key, value]) => (
            <div key={key} className="space-y-2">
                <Label htmlFor={`${category}-${key}`}>
                    {snakeToTitle(key).toUpperCase()}
                </Label>
                <Input
                    id={`${category}-${key}`}
                    type="number"
                    value={charges[category][key] || ''}
                    onChange={(e) => handleChange(category, key, e.target.value)}
                    disabled={disabled}
                />
            </div>
        ));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Charges</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {Object.keys(charges.core).length > 0 && renderChargeFields('core', charges.core)}
                    {Object.keys(charges.regulatory).length > 0 && renderChargeFields('regulatory', charges.regulatory)}
                    {Object.keys(charges.adherence).length > 0 && renderChargeFields('adherence', charges.adherence)}
                    {Object.keys(charges.additional).length > 0 && renderChargeFields('additional', charges.additional)}
                </CardContent>
            </Card>
        </div>
    );
} 