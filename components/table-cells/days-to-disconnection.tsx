import { Badge } from '../ui/badge';
export const DaysToDisconnectionCell = ({ row }: { row: any }) => {
    const disconnection = row.original.disconnection_date;
    if (disconnection) {
        const currentDate = new Date();
        const date = new Date(disconnection);
        const diffTime = date.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays == 1) {
            return <Badge variant={'destructive'}>1 days</Badge>;
        }
        if (diffDays < 0) {
            return (
                <Badge variant={'destructive'}>
                    {Math.abs(diffDays)} days past
                </Badge>
            );
        }
        return <Badge variant={'destructive'}>{diffDays} days</Badge>;
    }

};
