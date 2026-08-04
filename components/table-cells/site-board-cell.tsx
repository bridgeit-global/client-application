'use client';

import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { AccountNumberCell } from './account-number-cell';
import { SiteIdCell } from './site-cell';
import { ConnectionIdCell } from './connection-id-cell';

/** Compact site / account / board stack for table cells. */
export function SiteAccountBoardCell({ row }: { row: any }) {
  const isConnection = row.original?.connections;
  const siteCell = <SiteIdCell row={row} />;
  const accountCell = isConnection ? (
    <AccountNumberCell row={row} />
  ) : (
    <ConnectionIdCell row={row} />
  );
  const boardName = isConnection
    ? row.original.connections.biller_list.board_name
    : row.original.biller_list.board_name;

  return (
    <TooltipProvider>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="truncate">{siteCell}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">
          {accountCell}
        </div>
        {boardName ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="max-w-[180px] cursor-default truncate text-xs text-muted-foreground">
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
