'use client';

import { useState, useEffect } from 'react';
import {
  PDFViewer,
  HTMLViewer,
  type DocumentViewerLayout
} from './pdf-viewer-modal';
import { getPresignedUrl, type StorageSource } from '@/lib/utils/presigned-url-client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFViewerWithPresignedProps {
  fileKey: string;
  contentType?: 'pdf' | 'html';
  storageSource?: StorageSource;
  layout?: DocumentViewerLayout;
}

const EMBEDDED_SHELL =
  'h-[min(70vh,560px)] min-h-[480px] max-h-[560px] w-full';

/**
 * Client-side wrapper that fetches presigned URL and displays PDF/HTML viewer
 * This ensures the URL is fresh and avoids expiration issues
 */
export function PDFViewerWithPresigned({
  fileKey,
  contentType = 'pdf',
  storageSource = 's3',
  layout = 'page'
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
        const url = await getPresignedUrl(fileKey, storageSource);
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
      <div
        className={cn(
          'flex items-center justify-center',
          layout === 'embedded' && EMBEDDED_SHELL
        )}
        style={
          layout === 'page' ? { height: 'calc(100vh - 100px)' } : undefined
        }
      >
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !presignedUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          layout === 'embedded' && EMBEDDED_SHELL
        )}
        style={
          layout === 'page' ? { height: 'calc(100vh - 100px)' } : undefined
        }
      >
        <div className="max-w-md p-4 text-center">
          <p className="mb-2 font-semibold text-destructive">Failed to fetch</p>
          <p className="text-sm text-muted-foreground">
            {error || 'Unable to load document'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            If this issue persists, please check your network connection or
            contact support.
          </p>
        </div>
      </div>
    );
  }

  return contentType === 'pdf' ? (
    <PDFViewer pdfUrl={presignedUrl} layout={layout} />
  ) : (
    <HTMLViewer htmlUrl={presignedUrl} layout={layout} />
  );
}
