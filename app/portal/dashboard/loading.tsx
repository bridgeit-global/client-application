import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="grid gap-6">
      {/* Welcome heading */}
      <Skeleton className="h-7 w-64" />

      {/* Updated every 1 hour text (right aligned) */}
      <div className="flex justify-end">
        <Skeleton className="h-3 w-32" />
      </div>

      {/* KPI section area */}
      <div className="space-y-4">
        {/* Month picker skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-64" />
        </div>

        {/* KPI cards grid skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="mb-3 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
