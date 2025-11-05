import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import { Check, X } from 'lucide-react';
import { ddmmyy } from '@/lib/utils/date-format';
import { RegistrationsProps } from '@/types/registrations-type';

const ChildTable = ({
  parent_id,
  logs
}: {
  parent_id: string;
  logs: RegistrationsProps[];
}) => {
  const data = logs.filter((d) => d.parent_id == parent_id);
  return (
    <div>
      <Table className="min-w-full rounded-lg border border-gray-200 bg-white shadow-md">
        <TableHeader className="border-b border-gray-300 bg-gray-100">
          <TableRow>
            <TableHead className="w-72 border-r border-gray-300 py-3 text-center font-semibold text-gray-700">
              Id
            </TableHead>
            <TableHead className="w-72 border-r border-gray-300 py-3 text-center font-semibold text-gray-700">
              Created By
            </TableHead>
            <TableHead className="w-72 border-r border-gray-300 py-3 text-center font-semibold text-gray-700">
              Created At
            </TableHead>
            <TableHead className="w-72 border-r border-gray-300 py-3 text-center font-semibold text-gray-700">
              Approved
            </TableHead>
            <TableHead className="w-72 border-r border-gray-300 py-3 text-center font-semibold text-gray-700">
              Remark
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="border-b border-gray-300 py-3 text-center">
                {item.id.slice(0, 4) ?? 'N/A'}
              </TableCell>
              <TableCell className="border-b border-gray-300 py-3 text-center">
                {item.created_by.slice(0, 4) ?? 'N/A'}
              </TableCell>
              <TableCell className="border-b border-gray-300 py-3 text-center">
                {ddmmyy(item.created_at) ?? 'N/A'}
              </TableCell>
              <TableCell className="border-b border-gray-300 py-3 text-center">
                {item.approved !== undefined ? (
                  item.approved ? (
                    <Check />
                  ) : (
                    <X />
                  )
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell className="border-b border-gray-300 py-3 text-center">
                {item.remarks ?? 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ChildTable;
