import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MeterReadingLoading() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-64" />
                            <Skeleton className="h-9 w-64" />
                            <Skeleton className="h-9 w-32 ml-auto" />
                        </div>
                        <div className="rounded-md border">
                            <div className="p-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4 py-4">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <Skeleton key={j} className="h-4 flex-1" />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 