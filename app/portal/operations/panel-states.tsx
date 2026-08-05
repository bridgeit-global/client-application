'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export function PanelLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Calendar-shaped placeholder so insights content does not shift on load. */
export function PanelCalendarLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading calendar">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`day-${i}`} className="h-5" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`cell-${i}`} className="h-[100px]" />
        ))}
      </div>
    </div>
  );
}

export function PanelError({
  message,
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to load</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message || 'Something went wrong while loading this section.'}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
