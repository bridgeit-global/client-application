'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose
} from '@/components/ui/sheet';
import { Filter, FilterX } from 'lucide-react';
import IconButton from '@/components/buttons/icon-button';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BillerBoardSelector } from '@/components/input/biller-board-selector';
import { useSiteName } from '@/lib/utils/site';
type Props = {
    filterBody: {
        site_id?: string;
        zone_id?: string;
        type?: string;
        start_date?: string;
        end_date?: string;
        period?: string;
        due_date_start?: string;
        due_date_end?: string;
        account_number?: string;
    };
    setFilterBody: any;
    handleApplyFilters: any;
    handleClearFilter: any;
};

export default function FilterAction({
    filterBody,
    setFilterBody,
    handleApplyFilters,
    handleClearFilter
}: Props) {
    const site_name = useSiteName();
    const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterBody((prev: any) => ({
            ...prev,
            [e.target.id]: e.target.value
        }));
    };

    const onChangeSelectHandle = (key: string, value: string | string[]) => {
        setFilterBody((prev: any) => ({
            ...prev,
            [key]: Array.isArray(value) ? value.join(',') : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleApplyFilters();
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <IconButton variant="outline" icon={Filter} text="Filter" />
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[400px]" side="right">
                <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
                    <div className="grid gap-3">
                        <div className="space-y-1.5">
                            <Label>Time Period</Label>
                            <Select
                                value={filterBody.period}
                                onValueChange={(value) => onChangeSelectHandle("period", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Last Month</SelectItem>
                                    <SelectItem value="3">Last 3 Months</SelectItem>
                                    <SelectItem value="6">Last 6 Months</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {filterBody.period === 'custom' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date">Bill Date From</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={filterBody.start_date}
                                        onChange={onChangeHandle}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date">Bill Date To</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={filterBody.end_date}
                                        onChange={onChangeHandle}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="dueDateStart">Due Date Range</Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="due_date_start"
                                    type="date"
                                    value={filterBody.due_date_start}
                                    onChange={onChangeHandle}
                                />
                                <Input
                                    id="due_date_end"
                                    type="date"
                                    value={filterBody.due_date_end}
                                    onChange={onChangeHandle}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="account_number">Account Number</Label>
                            <Input
                                id="account_number"
                                value={filterBody.account_number}
                                onChange={onChangeHandle}
                                placeholder="Enter account number"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="site_id">{site_name} ID</Label>
                                <Input
                                    id="site_id"
                                    value={filterBody.site_id}
                                    onChange={onChangeHandle}
                                    placeholder={`Enter ${site_name} ID`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="zone_id">Zone ID</Label>
                                <Input
                                    id="zone_id"
                                    value={filterBody.zone_id}
                                    onChange={onChangeHandle}
                                    placeholder="Enter Zone ID"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <BillerBoardSelector
                                onChange={(value) => onChangeSelectHandle('biller_id', value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="station_type">{site_name} Type</Label>
                            <StationTypeSelector
                                value={Array.isArray(filterBody?.type) ? filterBody.type : filterBody?.type?.split(',') || []}
                                onChange={(types) => onChangeSelectHandle("type", types)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <SheetClose asChild>
                            <Button type="submit" className="w-full">
                                Apply Filters
                            </Button>
                        </SheetClose>
                        {handleClearFilter && (
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    className="w-full text-black"
                                    variant="link"
                                    onClick={handleClearFilter}
                                >
                                    Clear Filters <FilterX className="ml-2 h-4 w-4" />
                                </Button>
                            </SheetClose>
                        )}
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
