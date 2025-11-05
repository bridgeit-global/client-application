import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-red-600">
              Something went wrong!
            </h2>
            <p className="mb-4 text-gray-600">
              We apologize for the inconvenience. An unexpected error has
              occurred.
            </p>
            {this.state.error && (
              <div className="mb-4 text-sm text-gray-500">
                <p>Error: {this.state.error.message}</p>
              </div>
            )}
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="w-full"
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
