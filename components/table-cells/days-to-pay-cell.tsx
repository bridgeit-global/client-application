import { getDueDate } from '@/lib/utils/date-format';
import { Badge } from '../ui/badge';
export const DaysToPayCell = ({ row }: { row: any }) => {
    const pay_status = row.original.payment_status;

    const is_active = row.original.is_active;
    if (!is_active && !pay_status) {
        return (
            <Badge variant="outline">
                Carried Forward
            </Badge>
        );
    }

    const date_str = getDueDate(row.original.discount_date, row.original.due_date);
    if (!date_str) {
        return null;
    }
    const date = new Date(date_str);
    const currentDate = new Date();
    const diffTime = date.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
        'default';
    let badgeText: string;

    if (diffDays > 7) {
        badgeVariant = 'outline';
        badgeText = `${diffDays} days remaining`;
    } else if (diffDays > 0) {
        badgeVariant = 'secondary';
        badgeText = `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`;
    } else if (diffDays === 0) {
        badgeVariant = 'destructive';
        badgeText = 'Due today';
    } else {
        badgeVariant = 'destructive';
        badgeText = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'
            } overdue`;
    }

    if (pay_status) {
        return (
            <div className="w-40 text-left">
                <Badge variant={'success'}>
                    {'Paid'}
                </Badge>
            </div>
        );
    }
    return (
        <div className="w-40 text-left">
            <Badge variant={badgeVariant}>{badgeText}</Badge>
        </div>
    );

};
