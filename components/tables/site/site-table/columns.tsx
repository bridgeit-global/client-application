'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ddmmyy } from '@/lib/utils/date-format';
import { useSiteName } from '@/lib/utils/site';
import { SiteConnectionTableProps } from '@/types/site-type';
import { ConnectionsCell } from './connection-cell';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CopyIcon, EyeIcon } from 'lucide-react';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { ContextMenuContent } from '@/components/ui/context-menu';
import { ContextMenuTrigger } from '@/components/ui/context-menu';
import { ContextMenu } from '@/components/ui/context-menu';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SiteConnectionTableProps>[] = [
  {
    accessorKey: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => {
      const router = useRouter();
      const original = row.original;
      const displayId = original.id;
      const is_active = original.is_active;

      const handleCopy = () => navigator.clipboard.writeText(displayId);
      const goToSite = () => is_active ? router.push(`/portal/site-profile?id=${displayId}`) : null;
      return (
        <ContextMenu>
          <ContextMenuTrigger>
            <Badge
              className={`${is_active ? 'hover:bg-primary/40' : 'text-muted-foreground'}`}
              onClick={goToSite}
              variant="outline"
            >
              {displayId}
            </Badge>
          </ContextMenuTrigger>
          <ContextMenuContent className="min-w-[180px]">
            <ContextMenuItem
              onSelect={handleCopy}
              className="flex items-center gap-2 transition-colors hover:bg-primary/10"
            >
              <CopyIcon className="w-4 h-4" /> Copy
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={goToSite}
              className="flex items-center gap-2 transition-colors hover:bg-primary/10"
            >
              <EyeIcon className="w-4 h-4" /> View
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
  },
  {
    accessorKey: 'zone_id',
    header: 'Zone ID',
    cell: ({ row }) => row.original.zone_id && row.original.zone_id.length > 0 ? row.original.zone_id : ''
  },
  {
    accessorKey: 'type',
    header: () => {
      const site_name = useSiteName();
      return `${site_name} Type`;
    }
  },
  {
    accessorKey: 'connections',
    header: 'Connections',
    size: 300,
    cell: ({ row }) => <ConnectionsCell row={row} />
  },
  {
    accessorKey: 'created_at',
    header: 'Registration Date',
    cell: ({ row }) => row.original.created_at && ddmmyy(row.original.created_at)
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <CellAction data={row.original} />

  }
];
