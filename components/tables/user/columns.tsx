'use client';
import { ColumnDef } from '@tanstack/react-table';
import { UserTableProps } from '@/types/user-type';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<UserTableProps>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    size: 200,
  },
  {
    accessorKey: 'first_name',
    header: 'First Name',
    size: 200,
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name',
    size: 200,
  },
  {
    accessorKey: 'phone_no',
    header: 'Phone No',
    size: 200,
  },
  {
    header: 'Role',
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="capitalize">
          {row.original.role === 'admin' ? 'Admin' : 'User'}
        </Badge>
      );
    },
  },
];
