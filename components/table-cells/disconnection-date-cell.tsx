import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { BillsProps, SingleBillProps } from '@/types/bills-type';
import { DaysToPayCell } from './days-to-pay-cell';

const DisconnectionDateCell = ({ row }: { row: { original: BillsProps | SingleBillProps } }) => {
    const disconnection_date = row?.original?.disconnection_date;
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div
                    className={cn(
                        disconnection_date ? ' text-red-600 underline cursor-pointer' : ''
                    )}
                >
                    {disconnection_date}
                </div>
            </HoverCardTrigger>
            {disconnection_date && (
                <HoverCardContent className="w-fit">
                    <DaysToPayCell row={row} />
                </HoverCardContent>
            )}
        </HoverCard>
    );
};

export default DisconnectionDateCell;
