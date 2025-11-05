"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function MeterReadingError({ error, reset }: ErrorProps) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-red-600">Something went wrong!</CardTitle>
                    <CardDescription>
                        There was an error loading the submeter readings. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="mb-4 text-sm text-muted-foreground">
                        {error.message || "An unexpected error occurred"}
                    </div>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={reset} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try again
                        </Button>
                        <Button onClick={() => window.location.href = "/support/meter-reading"}>
                            Go back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 