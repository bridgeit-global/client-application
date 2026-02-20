import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
      <section className="md:snap-start">
        <div className="mx-auto w-full max-w-7xl">
          {/* Month picker + filters (matches KPISection) */}
          <div className="bg-background/80 border-b border-border/50">
            <div className="flex items-center justify-center py-4">
              <Skeleton className="h-10 w-64 rounded-md" />
            </div>
            <div className="flex items-center justify-center py-4 gap-4">
              <Skeleton className="h-10 w-40 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>
          </div>

          {/* Category sections skeleton */}
          <div className="space-y-12 py-8">
            {[1, 2, 3].map((categoryIndex) => (
              <div key={categoryIndex}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-border ml-4" />
                </div>

                {/* KPI cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-card p-4 space-y-3"
                    >
                      <div className="space-y-2">
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
