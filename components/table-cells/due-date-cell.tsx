import { ddmmyy, getDueDate } from '@/lib/utils/date-format';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import React from 'react'

export const DueDateCell = ({ discount_date_str = null, due_date_str }: { discount_date_str?: string | null, due_date_str: string }) => {
    const date_str = getDueDate(discount_date_str, due_date_str);
    if (!date_str) {
        return null
    }
    const date = new Date(date_str);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    // Calculate days difference
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine status and styling
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 3;

    const getStatusStyles = () => {
        if (isOverdue) {
            return {
                bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20',
                border: 'border-red-200/60 dark:border-red-800/40',
                text: 'text-red-700 dark:text-red-400',
                icon: <AlertTriangle className="w-3.5 h-3.5" />,
                label: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`
            };
        }
        if (isDueSoon) {
            return {
                bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
                border: 'border-amber-200/60 dark:border-amber-800/40',
                text: 'text-amber-700 dark:text-amber-400',
                icon: <Clock className="w-3.5 h-3.5" />,
                label: diffDays === 0 ? 'Due today' : `${diffDays} day${diffDays !== 1 ? 's' : ''} left`
            };
        }
        return {
            bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
            border: 'border-emerald-200/60 dark:border-emerald-800/40',
            text: 'text-emerald-700 dark:text-emerald-400',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            label: `${diffDays} days left`
        };
    };

    const status = getStatusStyles();

    return (
        <div className={`flex flex-col gap-1.5 p-2.5 rounded-lg ${status.bg} border ${status.border} transition-all duration-200 hover:shadow-sm min-w-[110px]`}>
            <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-md ${status.text} bg-white/60 dark:bg-slate-900/40`}>
                    <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {date ? ddmmyy(date.toISOString()) : ''}
                </span>
            </div>
            <div className={`flex items-center gap-1.5 ${status.text}`}>
                {status.icon}
                <span className="text-xs font-medium">{status.label}</span>
            </div>
        </div>
    )
}


