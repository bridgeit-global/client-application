import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PenaltiesProps } from '@/types/charges-type';
import { formatRupees } from '@/lib/utils/number-format';
import React from 'react';

export default async function PenaltiesTable({ data }: { data: PenaltiesProps[] }) {
    // Group data by state
    const groupedByState = data.reduce((acc, item) => {
        const state = item.biller_list.state || 'Unknown';
        if (!acc[state]) {
            acc[state] = [];
        }
        acc[state].push(item);
        return acc;
    }, {} as Record<string, PenaltiesProps[]>);

    return (
        <div>
            <h3 className="font-medium mb-3">Penalties Table Summary</h3>
            <div className="rounded-md border overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Biller</TableHead>
                            <TableHead className="text-right">Bill Count</TableHead>
                            <TableHead className="text-right">LPSC</TableHead>
                            <TableHead className="text-right">TOD Surcharge</TableHead>
                            <TableHead className="text-right">Low PF Surcharge</TableHead>
                            <TableHead className="text-right">Load Penalty</TableHead>
                            <TableHead className="text-right">PF Penalty</TableHead>
                            <TableHead className="text-right">Capacitor Surcharge</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(Object.entries(groupedByState) as [string, PenaltiesProps[]][]).sort((a, b) => a[0].localeCompare(b[0])).map(([state, stateItems]) => (
                            <React.Fragment key={state}>
                                {/* State Header Row */}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={9} className="font-bold">
                                        {state}
                                    </TableCell>
                                </TableRow>

                                {/* Board rows for this state */}
                                {stateItems
                                    .sort((a: PenaltiesProps, b: PenaltiesProps) => (a.biller_list.board_name || '').localeCompare(b.biller_list.board_name || ''))
                                    .map((penalty: PenaltiesProps) => {
                                        const total = (
                                            (penalty.lpsc || 0) +
                                            (penalty.tod_surcharge || 0) +
                                            (penalty.low_pf_surcharge || 0) +
                                            (penalty.sanctioned_load_penalty || 0) +
                                            (penalty.power_factor_penalty || 0) +
                                            (penalty.capacitor_surcharge || 0)
                                        );

                                        return (
                                            <TableRow key={penalty.biller_id}>
                                                <TableCell className="font-medium pl-6">{penalty.biller_list.board_name}</TableCell>
                                                <TableCell className="text-right">{penalty.bill_count ? penalty.bill_count : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.lpsc ? formatRupees(penalty.lpsc) : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.tod_surcharge ? formatRupees(penalty.tod_surcharge) : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.low_pf_surcharge ? formatRupees(penalty.low_pf_surcharge) : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.sanctioned_load_penalty ? formatRupees(penalty.sanctioned_load_penalty) : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.power_factor_penalty ? formatRupees(penalty.power_factor_penalty) : ''}</TableCell>
                                                <TableCell className="text-right">{penalty.capacitor_surcharge ? formatRupees(penalty.capacitor_surcharge) : ''}</TableCell>
                                                <TableCell className="text-right font-bold">{total ? formatRupees(total) : ''}</TableCell>
                                            </TableRow>
                                        );
                                    })}

                                {/* State total row */}
                                <TableRow className="bg-muted/20 font-medium">
                                    <TableCell className="pl-4">State Total</TableCell>
                                    <TableCell className="text-right">
                                        {stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.bill_count || 0), 0)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.lpsc || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.tod_surcharge || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.low_pf_surcharge || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.sanctioned_load_penalty || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.power_factor_penalty || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce((sum: number, p: PenaltiesProps) => sum + (p.capacitor_surcharge || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatRupees(stateItems.reduce<number>((sum, p) => sum + (
                                            (p.lpsc || 0) +
                                            (p.tod_surcharge || 0) +
                                            (p.low_pf_surcharge || 0) +
                                            (p.sanctioned_load_penalty || 0) +
                                            (p.power_factor_penalty || 0) +
                                            (p.capacitor_surcharge || 0)
                                        ), 0))}
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}

                        {/* Grand total row */}
                        <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Grand Total</TableCell>
                            <TableCell className="text-right">
                                {data.reduce<number>((sum, p) => sum + (p.bill_count || 0), 0)}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.lpsc || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.tod_surcharge || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.low_pf_surcharge || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.sanctioned_load_penalty || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.power_factor_penalty || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (p.capacitor_surcharge || 0), 0))}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatRupees(data.reduce<number>((sum, p) => sum + (
                                    (p.lpsc || 0) +
                                    (p.tod_surcharge || 0) +
                                    (p.low_pf_surcharge || 0) +
                                    (p.sanctioned_load_penalty || 0) +
                                    (p.power_factor_penalty || 0) +
                                    (p.capacitor_surcharge || 0)
                                ), 0))}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
