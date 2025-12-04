'use client';

import { useState, useEffect } from 'react';
import { PDFViewer, HTMLViewer } from './pdf-viewer-modal';
import { getPresignedUrl } from '@/lib/utils/presigned-url-client';
import { Loader2 } from 'lucide-react';

interface PDFViewerWithPresignedProps {
  fileKey: string;
  contentType?: 'pdf' | 'html';
}

/**
 * Client-side wrapper that fetches presigned URL and displays PDF/HTML viewer
 * This ensures the URL is fresh and avoids expiration issues
 */
export function PDFViewerWithPresigned({ 
  fileKey, 
  contentType = 'pdf' 
}: PDFViewerWithPresignedProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!fileKey) {
        setError('No file key provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const url = await getPresignedUrl(fileKey);
        console.log(url)
        setPresignedUrl(url);
      } catch (err: any) {
        console.error('Failed to get presigned URL:', err);
        setError(err?.message || 'Failed to generate document URL. Please refresh the page and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [fileKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ height: 'calc(100vh - 100px)' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !presignedUrl) {
    return (
      <div className="flex items-center justify-center h-full" style={{ height: 'calc(100vh - 100px)' }}>
        <div className="text-center p-4 max-w-md">
          <p className="text-red-500 mb-2 font-semibold">Failed to fetch</p>
          <p className="text-sm text-muted-foreground">{error || 'Unable to load document'}</p>
          <p className="text-xs text-muted-foreground mt-2">
            If this issue persists, please check your network connection or contact support.
          </p>
        </div>
      </div>
    );
  }

  return contentType === 'pdf' ? (
    <PDFViewer pdfUrl={presignedUrl} />
  ) : (
    <HTMLViewer htmlUrl={presignedUrl} />
  );
}
