'use client';
import { Label } from '@/components/ui/label';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { useZoneId } from '@/hooks/use-zone-id';

interface ZoneIdSelectorProps {
    label?: string;
    placeholder?: string;
    onChange: (value: string[]) => void;
}

export function ZoneIdSelector({
    label,
    placeholder = 'Select Zone ID',
    onChange,
}: ZoneIdSelectorProps) {
    const zoneIds = useZoneId();

    const handleSelectChange = (selectedOptions: Option[]) => {
        onChange(selectedOptions.map((option: Option) => option?.value));
    };

    const defaultList: Option[] = zoneIds.map((e) => ({
        label: e.label,
        value: e.value
    }));

    const handleSearch = (searchTerm: string) => {
        return zoneIds
            .filter((e) => e.label.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((e) => ({
                label: e.label,
                value: e.value
            }));
    };

    return (
        <div className="space-y-2">
            {label && <Label htmlFor="zone_id">{label}</Label>}
            <MultipleSelector
                className="w-full rounded-full"
                commandProps={{
                    label: placeholder
                }}
                maxSelected={5}
                onChange={handleSelectChange}
                defaultOptions={defaultList}
                onSearchSync={handleSearch}
                placeholder={placeholder}
                hideClearAllButton
                hidePlaceholderWhenSelected
                emptyIndicator={<p className="text-center text-sm">No results found</p>}
            />
        </div>
    );
}
