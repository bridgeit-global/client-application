'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-8 w-8" />
                <h2 className="text-xl font-semibold">Something went wrong!</h2>
            </div>

            <p className="text-gray-600 text-center max-w-md">
                An error occurred while loading the batch management page. Please try refreshing the page.
            </p>

            <div className="flex space-x-2">
                <Button onClick={reset} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                </Button>
                <Button onClick={() => window.location.href = '/portal/dashboard'}>
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
