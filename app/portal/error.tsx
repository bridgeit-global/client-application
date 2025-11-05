'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-4 text-2xl font-semibold text-red-600">
          Something went wrong!
        </h2>
        <p className="mb-4 text-gray-600">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="mb-4 text-sm text-gray-500">
          <p>Error: {error.message}</p>
          {error.digest && <p>Digest: {error.digest}</p>}
        </div>
        <Button onClick={() => reset()} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  );
}
