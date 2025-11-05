'use client';
import { TooltipContent, Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AccountNumberCell } from "./account-number-cell";
import { SiteIdCell } from "./site-cell";
import { useSiteName } from "@/lib/utils/site";
import { ConnectionIdCell } from "./connection-id-cell";

export function SiteAccountBoardCell({ row }: { row: any }) {

    const isConnection = row.original?.connections;
    const site_name = useSiteName();
    const siteCell = <SiteIdCell row={row} />;
    const accountCell = isConnection ? <AccountNumberCell row={row} /> : <ConnectionIdCell row={row} />;
    const boardName = isConnection ? row.original.connections.biller_list.board_name : row.original.biller_list.board_name;
    return (
        <TooltipProvider>
            <div className="flex flex-col gap-1 p-2 border border-muted-foreground/10 rounded-md bg-transparent">
                <div className="flex items-center gap-1 cursor-pointer focus:outline-none" tabIndex={0} aria-label={`${site_name}`}>
                    <span className="text-xs truncate max-w-[140px]">{siteCell}</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer focus:outline-none" tabIndex={0} aria-label="Account Number">
                    <span className="text-xs truncate max-w-[140px]">{accountCell}</span>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer focus:outline-none" tabIndex={0} aria-label="Board Name">
                            <span className="text-xs truncate max-w-[140px]">{boardName}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{boardName}</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}