'use client';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { ChevronRight } from 'lucide-react';

interface ConnectionsCellProps {
  row: {
    original: Record<string, any>;
  };
}

export function ConnectionsCell({ row }: ConnectionsCellProps) {
  const connections = row.original.connections;

  if (!connections || connections.length === 0) {
    return <span className="text-muted-foreground">No connections</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connections.map((connection: Record<string, any>, index: number) => (
        <div className="flex items-center gap-1 px-2 py-1">
          <span className="font-medium">{connection.account_number}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{connection.connections.biller_list.board_name}</span>
        </div>
      ))}
    </div>
  );
}
