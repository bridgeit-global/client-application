'use client';
import { AddConnectionButton } from '@/components/buttons/add-connection-button';
interface ConnectionsCellProps {
  row: {
    original: Record<string, any>;
  };
}

export function ConnectionsCell({ row }: ConnectionsCellProps) {
  const connections = row.original.connections;

  return (
    <div className="flex items-center gap-2">
      <AddConnectionButton siteId={row.original.id} connections={connections} />
    </div>
  );
}
