import { Suspense } from 'react';
import { OperationsView } from './operations-view';
import { Skeleton } from '@/components/ui/skeleton';

function OperationsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function OperationsPage() {
  return (
    <Suspense fallback={<OperationsFallback />}>
      <OperationsView />
    </Suspense>
  );
}
