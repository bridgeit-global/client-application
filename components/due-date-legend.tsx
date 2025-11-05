'use client'
import React from 'react';

const DueDateLegend = () => (
    <div className="my-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Due Date Color Legend</h4>
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <span className="text-xs text-gray-700">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-700">Due Today</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs text-gray-700">Due Soon (within 7 days)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-gray-700">Due Later (more than 7 days)</span>
            </div>
        </div>
    </div>
);

export default DueDateLegend; 