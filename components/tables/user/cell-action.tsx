'use client';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SiteConnectionTableProps } from '@/types/site-type';

interface CellActionProps {
  data: SiteConnectionTableProps;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => router.push(`/portal/site-edit?id=${data.id}`)}
      title="Edit site"
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
};

