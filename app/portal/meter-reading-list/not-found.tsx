import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Home } from "lucide-react"
import Link from "next/link"

export default function MeterReadingNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Page Not Found</CardTitle>
                    <CardDescription>
                        The submeter reading page you're looking for doesn't exist.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="mb-4 text-sm text-muted-foreground">
                        The page may have been moved, deleted, or you entered the wrong URL.
                    </div>
                    <div className="flex gap-2 justify-center">
                        <Button asChild variant="outline">
                            <Link href="/support/meter-reading">
                                <Search className="mr-2 h-4 w-4" />
                                View All Readings
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/support/dashboard">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 