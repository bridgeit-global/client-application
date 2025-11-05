import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BlogCardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array(count).fill(0).map((_, i) => (
                <Card key={i} className="h-64">
                    <CardHeader>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 