import { Badge } from '@/components/ui/badge';
import { formatRupees } from '@/lib/utils/number-format';
import { getTodaysAmount } from '@/lib/utils/bill';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';
import { TrendingDown, TrendingUp, Wallet, AlertTriangle, Clock } from 'lucide-react';

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
    
    // Calculate LPSC: use adherence_charges.lpsc if available, otherwise 1.5% of bill amount
    const lpscFromAdherence = bill.adherence_charges?.lpsc || 0;
    const calculatedLPSC = baseAmount * 0.015;
    const lpscAmount = lpscFromAdherence > 0 ? lpscFromAdherence : calculatedLPSC;
    
    // Determine payment scenarios
    const isPenaltyApplied = dueDate && currentDate > dueDate && penalty > 0;
    const isPenaltyWarning = dueDate && currentDate <= dueDate && penalty > 0; // Show penalty warning before due date
    const isDueRebateApplied = dueDate && currentDate <= dueDate && dueDateRebate > 0;
    const isDiscountRebateApplied = discountDate && currentDate <= discountDate && discountDateRebate > 0;
    
    // LPSC applies only if:
    // - Current date is after due date
    // - No rebates are applicable (payment is overdue)
    // - LPSC amount is greater than 0
    // Note: LPSC is shown as a warning even if rebates were available but missed
    const isLPSCApplicable = dueDate && currentDate > dueDate && lpscAmount > 0;
    
    // Calculate days until/since discount date and due date
    const daysUntilDiscountDate = discountDate ? Math.ceil((discountDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const daysUntilDueDate = dueDate ? Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const daysPastDueDate = dueDate && currentDate > dueDate ? Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
                            {/* Discount Date Rebate - Best option (Green/Emerald) */}
                            {isDiscountRebateApplied && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50 text-xs font-medium">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    -{formatRupees(discountDateRebate)}
                                </Badge>
                            )}
                            {/* Due Date Rebate - Good option (Teal/Cyan) */}
                            {isDueRebateApplied && !isDiscountRebateApplied && (
                                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-700/50 text-xs font-medium">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    -{formatRupees(dueDateRebate)}
                                </Badge>
                            )}
                            {/* Penalties - Applied after missing due date (Red) */}
                            {isPenaltyApplied && (
                                <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50 text-xs font-medium">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{formatRupees(penalty)}
                                </Badge>
                            )}
                            {/* Penalty Warning - Will be applied if not paid by due date (Orange) */}
                            {isPenaltyWarning && (
                                <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700/50 text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Penalty: {formatRupees(penalty)}
                                </Badge>
                            )}
                            {/* LPSC Warning - Future charge (Amber) */}
                            {isLPSCApplicable && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    LPSC: {formatRupees(lpscAmount)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-0 overflow-hidden max-w-md">
                    <div className="flex flex-col min-w-[320px] max-w-[450px]">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Urgency Details</span>
                        </div>
                        <div className="flex flex-col gap-3 p-4 max-h-[500px] overflow-y-auto">
                            {/* Base Amount */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Amount</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatRupees(baseAmount)}</span>
                            </div>

                            {/* Urgency Messaging Section */}
                            <div className="space-y-2.5">
                                {/* Discount Date Rebate - Best Option */}
                                {discountDate && discountDateRebate > 0 && (
                                    <div className={`rounded-lg p-3 ${isDiscountRebateApplied ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'}`}>
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <TrendingDown className={`w-4 h-4 flex-shrink-0 ${isDiscountRebateApplied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                                <span className={`text-sm font-medium truncate ${isDiscountRebateApplied ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    Discount Date Rebate
                                                </span>
                                            </div>
                                            <span className={`text-sm font-semibold flex-shrink-0 ${isDiscountRebateApplied ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                - {formatRupees(discountDateRebate)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-words">
                                            {isDiscountRebateApplied ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">✓ Applied (Pay by {formatDate(discountDate)})</span>
                                            ) : daysUntilDiscountDate !== null && daysUntilDiscountDate > 0 ? (
                                                <span className="break-words">Pay by {formatDate(discountDate)} to save {formatRupees(discountDateRebate)} ({daysUntilDiscountDate} day{daysUntilDiscountDate !== 1 ? 's' : ''} left)</span>
                                            ) : (
                                                <span className="text-slate-500 break-words">Discount date passed ({formatDate(discountDate)})</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Due Date Rebate - Good Option */}
                                {dueDate && dueDateRebate > 0 && (
                                    <div className={`rounded-lg p-3 ${isDueRebateApplied && !isDiscountRebateApplied ? 'bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'}`}>
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <TrendingDown className={`w-4 h-4 flex-shrink-0 ${isDueRebateApplied && !isDiscountRebateApplied ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                                                <span className={`text-sm font-medium truncate ${isDueRebateApplied && !isDiscountRebateApplied ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    Due Date Rebate
                                                </span>
                                            </div>
                                            <span className={`text-sm font-semibold flex-shrink-0 ${isDueRebateApplied && !isDiscountRebateApplied ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                - {formatRupees(dueDateRebate)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-words">
                                            {isDueRebateApplied && !isDiscountRebateApplied ? (
                                                <span className="text-teal-600 dark:text-teal-400">✓ Applied (Pay by {formatDate(dueDate)})</span>
                                            ) : daysUntilDueDate !== null && daysUntilDueDate > 0 ? (
                                                <span className="break-words">Pay by {formatDate(dueDate)} to save {formatRupees(dueDateRebate)} ({daysUntilDueDate} day{daysUntilDueDate !== 1 ? 's' : ''} left)</span>
                                            ) : (
                                                <span className="text-slate-500 break-words">Due date passed ({formatDate(dueDate)})</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Penalties - Warning before due date or Applied after missing due date */}
                                {penalty > 0 && (
                                    <div className={`rounded-lg p-3 ${isPenaltyApplied ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-700' : 'bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-700'}`}>
                                        <div className="flex items-center justify-between mb-1.5 gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {isPenaltyApplied ? (
                                                    <TrendingUp className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                                                )}
                                                <span className={`text-sm font-semibold truncate ${isPenaltyApplied ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                                    Late Penalty
                                                </span>
                                            </div>
                                            <span className={`text-sm font-bold flex-shrink-0 ${isPenaltyApplied ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                                + {formatRupees(penalty)}
                                            </span>
                                        </div>
                                        <div className={`text-xs leading-relaxed break-words ${isPenaltyApplied ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                            {isPenaltyApplied ? (
                                                <span className="font-medium break-words">✓ Applied after missing due date ({daysPastDueDate} day{daysPastDueDate !== 1 ? 's' : ''} overdue)</span>
                                            ) : dueDate ? (
                                                <span className="break-words">⚠ Will be applied if payment is not made by <strong>{formatDate(dueDate)}</strong> ({daysUntilDueDate} day{daysUntilDueDate !== 1 ? 's' : ''} remaining)</span>
                                            ) : (
                                                <span className="break-words">⚠ Will be applied if payment is delayed</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* LPSC Warning - Future charge */}
                                {isLPSCApplicable && (
                                    <div className="rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                <span className="text-sm font-medium truncate text-amber-700 dark:text-amber-300">LPSC (Next Bill)</span>
                                            </div>
                                            <span className="text-sm font-semibold flex-shrink-0 text-amber-700 dark:text-amber-400">+ {formatRupees(lpscAmount)}</span>
                                        </div>
                                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 break-words">
                                            {lpscFromAdherence > 0 
                                                ? <span className="break-words">Late Payment Surcharge from previous bill (will be added to next bill)</span>
                                                : <span className="break-words">Estimated LPSC (1.5% of bill amount) - will be applied to next bill if not paid on or before due date</span>
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Today's Payable Summary */}
                            <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-3 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Today&apos;s Payable</span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatRupees(todayAmount)}</span>
                                </div>
                                {(isPenaltyWarning || isLPSCApplicable) && (
                                    <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        {isPenaltyWarning && !isPenaltyApplied && (
                                            <div className="text-xs text-orange-600 dark:text-orange-400 flex items-start gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                <span className="leading-relaxed break-words">Penalty of <strong>{formatRupees(penalty)}</strong> will be added if payment is not made by {dueDate ? formatDate(dueDate) : 'due date'}</span>
                                            </div>
                                        )}
                                        {isLPSCApplicable && (
                                            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                                                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                <span className="leading-relaxed break-words">LPSC of <strong>{formatRupees(lpscAmount)}</strong> will be added to your next bill if payment is delayed</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default TodaysPayableAmountCell; 