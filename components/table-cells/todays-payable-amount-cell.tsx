import { Badge } from '@/components/ui/badge';
import { formatRupees } from '@/lib/utils/number-format';
import { getTodaysAmount } from '@/lib/utils/bill';
import ReceiptIndianRupee from '@/components/icons/receipt-indian-rupee';
import HandCoin from '@/components/icons/hand-coin';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';

interface TodaysPayableAmountCellProps {
    bill: any;
}

const TodaysPayableAmountCell: React.FC<TodaysPayableAmountCellProps> = ({ bill }) => {
    const baseAmount = bill.bill_amount;
    const dueDateRebate = bill.due_date_rebate || 0;
    const discountDateRebate = bill.discount_date_rebate || 0;
    const penalty = bill.penalty_amount || 0;
    const todayAmount = getTodaysAmount(bill);
    const currentDate = new Date(new Date().toISOString().split('T')[0]);
    const dueDate = bill.due_date ? new Date(bill.due_date) : null;
    const discountDate = bill.discount_date ? new Date(bill.discount_date) : null;
    const isPenaltyApplied = dueDate && currentDate > dueDate && penalty > 0;
    const isDueRebateApplied = dueDate && currentDate <= dueDate && dueDateRebate > 0;
    const isDiscountRebateApplied = discountDate && currentDate <= discountDate && discountDateRebate > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-start gap-1 cursor-pointer focus:outline-none" tabIndex={0} aria-label="Today's Amount Details">
                        <span className="flex items-center gap-1 text-base font-semibold">
                            {/* <ReceiptIndianRupee size={18} className="text-primary" /> */}
                            {formatRupees(todayAmount)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                Base: {formatRupees(baseAmount)}
                            </Badge>
                            {isDueRebateApplied && (
                                <Badge variant="success" className="flex items-center gap-1">
                                    <HandCoin size={14} className="text-success" />
                                    -{formatRupees(dueDateRebate)} Due Rebate
                                </Badge>
                            )}
                            {isDiscountRebateApplied && (
                                <Badge variant="success" className="flex items-center gap-1">
                                    <HandCoin size={14} className="text-success" />
                                    -{formatRupees(discountDateRebate)} Discount
                                </Badge>
                            )}
                            {isPenaltyApplied && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    +{formatRupees(penalty)} Penalty
                                </Badge>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <div className="flex flex-col gap-1 min-w-[180px]">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Base Amount:</span>
                            <span>{formatRupees(baseAmount)}</span>
                        </div>
                        {isDueRebateApplied && (
                            <div className="flex items-center justify-between">
                                <span>Due Date Rebate:</span>
                                <span className="text-success">- {formatRupees(dueDateRebate)}</span>
                            </div>
                        )}
                        {isDiscountRebateApplied && (
                            <div className="flex items-center justify-between">
                                <span>Discount Date Rebate:</span>
                                <span className="text-success">- {formatRupees(discountDateRebate)}</span>
                            </div>
                        )}
                        {isPenaltyApplied && (
                            <div className="flex items-center justify-between">
                                <span>Penalty:</span>
                                <span className="text-destructive">+ {formatRupees(penalty)}</span>
                            </div>
                        )}
                        <div className="border-t my-1" />
                        <div className="flex items-center justify-between font-semibold">
                            <span>Today&apos;s Amount:</span>
                            <span>{formatRupees(todayAmount)}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TodaysPayableAmountCell; 