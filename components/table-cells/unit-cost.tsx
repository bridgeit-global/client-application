import { formatRupees } from '@/lib/utils/number-format';
import { Row } from '@tanstack/react-table';
import { AllBillTableProps } from '@/types/bills-type';
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface UnitCostProps {
    row: { original: AllBillTableProps };
}

export const UnitCost = ({ row }: UnitCostProps) => {
    const isNormalBill = row.original.bill_type.toLowerCase() === 'normal';
    let statusMessage = '';

    if (!isNormalBill) {
        statusMessage = 'Abnormal Bill';
    } else if (row.original.billed_unit < 1000) {
        statusMessage = 'Insufficient unit consumed';
    }

    if (statusMessage) {
        return (
            <HoverCard>
                <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <InfoIcon className="h-4 w-4" />
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-fit">
                    <p>{statusMessage}</p>
                </HoverCardContent>
            </HoverCard>
        );
    }

    return row.original.unit_cost ? formatRupees(row.original.unit_cost) : null;
};
