import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* All Batches Section */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-64 w-full" />
            </div>

            {/* All Items in Batches Section */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-64 w-full" />
            </div>

            {/* Create New Batches Section */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-88" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
