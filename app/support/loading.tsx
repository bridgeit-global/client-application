import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
