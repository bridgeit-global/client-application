import { ddmmyy, getDueDate, getDueDateSignalColor } from '@/lib/utils/date-format';
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
    const signalColor = getDueDateSignalColor(date.toISOString());
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${signalColor}`}></div>
            <span>{date ? ddmmyy(date.toISOString()) : ''}</span>
        </div>
    )
}


