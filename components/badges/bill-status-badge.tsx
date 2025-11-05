import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import { formatRupees } from '@/lib/utils/number-format';
import { getAfterDueAmount } from '@/lib/utils';
import { getLatestBill } from '@/lib/utils/bill';

interface BillStatusBadgeProps {
    bill: any;
}

export function BillStatusBadge({ bill }: BillStatusBadgeProps) {
    const isAmountIncreased = bill.approved_amount && getAfterDueAmount(bill) > bill.approved_amount;
    const difference = isAmountIncreased && bill.approved_amount ? getAfterDueAmount(bill) - bill.approved_amount : 0;
    const isNewBill = bill.payment_status === false && bill.is_active === false;
    const dueDate = new Date(bill.due_date);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const latestBill = getLatestBill(bill.connections.bills);
    const latestBillAmount = latestBill ? getAfterDueAmount(latestBill) : 0;
    const increasedAmount = latestBillAmount - (bill.approved_amount || 0);

    return (
        <div className="flex items-center gap-2">
            {isNewBill && increasedAmount > 0 && (
                <Badge variant={'destructive'} className='flex items-center gap-2'><ArrowUpRight className='w-4 h-4' />Amount: {formatRupees(increasedAmount)}</Badge>
            )}
            {bill.payment_status === false && dueDate <= today && isAmountIncreased && (
                <Badge variant={'destructive'} className='flex items-center gap-2'><ArrowUpRight className='w-4 h-4' />Amount: {formatRupees(difference)}</Badge>
            )}
        </div>
    );
} 