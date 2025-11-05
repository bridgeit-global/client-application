import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { AlertCircle, Wallet } from 'lucide-react';
import { getPrepaidBalance } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';

interface LowBalanceBadgeProps {
    row: {
        original: {
            prepaid_balances: any[];
            prepaid_info: {
                threshold_amount: number;
            } | null;
        };
    };
}

export const LowBalanceCellBadge: React.FC<LowBalanceBadgeProps> = ({ row }) => {
    const prepaid_balances = row.original.prepaid_balances;
    const prepaid_info = row.original.prepaid_info;

    if (prepaid_balances && prepaid_balances.length) {
        const prepaidBalance = getPrepaidBalance(prepaid_balances);
        if (prepaidBalance) {
            const balance = prepaidBalance.balance_amount;
            const isLowBalance =
                prepaid_info && balance < prepaid_info.threshold_amount;

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge
                                variant={isLowBalance ? 'destructive' : 'secondary'}
                                className="flex items-center space-x-1 px-3 py-1"
                            >
                                <Wallet className="mr-1 h-4 w-4" />
                                <span>{formatRupees(balance)}</span>
                                {isLowBalance && <AlertCircle className="ml-1 h-4 w-4" />}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {isLowBalance
                                    ? `Low balance! Threshold: ${formatRupees(
                                        prepaid_info.threshold_amount
                                    )}`
                                    : 'Current prepaid balance'}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
    }

    return null;
};
