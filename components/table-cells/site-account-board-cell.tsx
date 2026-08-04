'use client';
import { TooltipContent, Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AccountNumberCell } from "./account-number-cell";
import { SiteIdCell } from "./site-cell";
import { ConnectionIdCell } from "./connection-id-cell";

export function SiteAccountBoardCell({ row }: { row: any }) {
    const isConnection = row.original?.connections;
    const siteCell = <SiteIdCell row={row} />;
    const accountCell = isConnection ? <AccountNumberCell row={row} /> : <ConnectionIdCell row={row} />;
    const boardName = isConnection
        ? row.original.connections.biller_list.board_name
        : row.original.biller_list.board_name;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="truncate">{siteCell}</div>
                <div className="font-mono text-xs text-muted-foreground truncate">
                    {accountCell}
                </div>
                {boardName ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate max-w-[180px] cursor-default">
                                {boardName}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-center">
                            {boardName}
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
