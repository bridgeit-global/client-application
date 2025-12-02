'use client';
import { TooltipContent, Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AccountNumberCell } from "./account-number-cell";
import { SiteIdCell } from "./site-cell";
import { useSiteName } from "@/lib/utils/site";
import { ConnectionIdCell } from "./connection-id-cell";
import { MapPin, Hash, Building2 } from "lucide-react";

export function SiteAccountBoardCell({ row }: { row: any }) {

    const isConnection = row.original?.connections;
    const site_name = useSiteName();
    const siteCell = <SiteIdCell row={row} />;
    const accountCell = isConnection ? <AccountNumberCell row={row} /> : <ConnectionIdCell row={row} />;
    const boardName = isConnection ? row.original.connections.biller_list.board_name : row.original.biller_list.board_name;
    return (
        <TooltipProvider>
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200 min-w-[180px]">
                {/* Site/Location */}
                <div className="flex items-center gap-2 cursor-pointer focus:outline-none group" tabIndex={0} aria-label={`${site_name}`}>
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                        <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] group-hover:text-primary transition-colors">{siteCell}</span>
                </div>

                {/* Account Number */}
                <div className="flex items-center gap-2 cursor-pointer focus:outline-none" tabIndex={0} aria-label="Account Number">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Hash className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{accountCell}</span>
                </div>

                {/* Board Name */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer focus:outline-none" tabIndex={0} aria-label="Board Name">
                            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px] leading-tight">{boardName}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] text-center">{boardName}</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}