'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RegistrationsProps } from '@/types/registrations-type';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { snakeToTitle } from '@/lib/utils/string-format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ddmmyy } from '@/lib/utils/date-format';
export const columns: ColumnDef<RegistrationsProps>[] = [
  {
    header: 'Created By',
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Avatar className='h-9 w-9 rounded-lg border-2 border-border/60'>
            <AvatarImage
              src={''}
              alt={row.original.users?.first_name || ''}
            />
            <AvatarFallback className='rounded-lg bg-sidebar-accent text-foreground'>
              {row.original.users?.first_name?.[0].toUpperCase() || '?'}{row.original.users?.first_name?.[1].toUpperCase() || ''}
            </AvatarFallback>
          </Avatar>
          <span>{row.original.created_by ? `${row.original.users.first_name} ${row.original.users.last_name}` : 'N/A'}</span>
        </div>
      );
    }
  },
  {
    header: 'Data',
    cell: ({ row }) => {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              View Data
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-[500px] max-h-[400px] overflow-y-auto p-4 shadow-lg rounded-lg border border-gray-200">
            <div className="space-y-3">
              <h3 className="font-bold text-lg border-b pb-2 mb-2">Registration Data</h3>
              {row.original.data && typeof row.original.data === 'object' && Object.keys(row.original.data).map((key) =>
                key !== 'created_by' && key !== 'is_bulk' && key !== 'remarks' && key !== 'name' ? (
                  <div key={key} className="flex justify-between gap-4 py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{snakeToTitle(key)}:</span>
                    <span className="text-right break-all text-gray-900">
                      {key === 'parameters' && typeof row.original.data === 'object' && row.original.data
                        ? <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">{JSON.stringify((row.original.data as Record<string, any>)[key], null, 2)}</pre>
                        : typeof row.original.data === 'object' && row.original.data
                          ? (row.original.data as Record<string, any>)[key]
                          : null}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
  },

  {
    header: 'Registration',
    cell: ({ row }) => {
      const createdAt = new Date(row.original.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let timeAgo;
      let colorClass = 'text-gray-600';

      if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
        colorClass = 'text-green-600';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        colorClass = 'text-blue-600';
      } else {
        timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }

      // Use explicit date formatting to ensure consistency between server and client

      return (
        <div className="flex flex-col">
          <span className={`${colorClass} font-medium`}>{timeAgo}</span>
          <span className="text-xs text-gray-500">{ddmmyy(row.original.created_at)}</span>
        </div>
      );
    }
  },
  {
    header: 'Remarks',
    size: 300,
    cell: ({ row }) => {
      return (
        <div className="space-y-1">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${row.original.approved ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} w-fit`}>
            {row.original.approved ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            )}
            <p className="text-sm font-medium">{row.original.remarks || (row.original.approved ? 'Approved' : 'Not Approved')}</p>
          </div>
        </div>
      );
    }
  },
  {
    header: 'Parent ID',
    cell: ({ row }) => (
      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.original.parent_id || 'N/A'}</div>
    )
  },

];
