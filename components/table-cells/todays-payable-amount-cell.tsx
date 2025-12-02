import { Badge } from '@/components/ui/badge';
import { formatRupees } from '@/lib/utils/number-format';
import { getTodaysAmount } from '@/lib/utils/bill';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';
import { IndianRupee, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

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
                    <div className="flex flex-col items-start gap-2 cursor-pointer focus:outline-none p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100/60 dark:border-blue-800/30 hover:shadow-md transition-all duration-200 min-w-[140px]" tabIndex={0} aria-label="Today's Amount Details">
                        {/* Main Amount */}
                        <div className="flex items-center gap-2">
                            {/* <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                <IndianRupee className="w-4 h-4" />
                            </div> */}
                            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                {formatRupees(todayAmount)}
                            </span>
                        </div>

                        {/* Base Amount & Modifiers */}
                        <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 text-xs font-medium">
                                <Wallet className="w-3 h-3 mr-1 opacity-60" />
                                Base: {formatRupees(baseAmount)}
                            </Badge>
                            {isDueRebateApplied && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50 text-xs font-medium">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    -{formatRupees(dueDateRebate)}
                                </Badge>
                            )}
                            {isDiscountRebateApplied && (
                                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-700/50 text-xs font-medium">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    -{formatRupees(discountDateRebate)}
                                </Badge>
                            )}
                            {isPenaltyApplied && (
                                <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50 text-xs font-medium">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{formatRupees(penalty)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-0 overflow-hidden">
                    <div className="flex flex-col min-w-[220px]">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount Breakdown</span>
                        </div>
                        <div className="flex flex-col gap-2 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Base Amount</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatRupees(baseAmount)}</span>
                            </div>
                            {isDueRebateApplied && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400">Due Date Rebate</span>
                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">- {formatRupees(dueDateRebate)}</span>
                                </div>
                            )}
                            {isDiscountRebateApplied && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-teal-600 dark:text-teal-400">Discount Rebate</span>
                                    <span className="text-sm font-medium text-teal-600 dark:text-teal-400">- {formatRupees(discountDateRebate)}</span>
                                </div>
                            )}
                            {isPenaltyApplied && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-red-600 dark:text-red-400">Late Penalty</span>
                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">+ {formatRupees(penalty)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-1" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today&apos;s Payable</span>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{formatRupees(todayAmount)}</span>
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TodaysPayableAmountCell; 