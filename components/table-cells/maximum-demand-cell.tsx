
import { ConnectionsProps } from '@/types/connections-type';
import React from 'react'

export const MaximumDemandCell = ({ row }: { row: { original: ConnectionsProps } }) => {

    if (!row.original.billed_demand || !row.original.sanction_load) {
        return null;
    }

    const maximum_demand = row.original.billed_demand;
    const sanction_load = row.original.sanction_load;
    let signalColor = '';
    if (maximum_demand > sanction_load) {
        signalColor = 'bg-red-400';
    } else {
        signalColor = 'bg-green-400';
    }
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${signalColor}`}></div>
            <span>{maximum_demand ? maximum_demand : ''}</span>
        </div>
    )
}


