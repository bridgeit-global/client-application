'use client';

import { useState, useEffect } from 'react';
import DocumentViewerModal from './document-viewer-modal';
import { getPresignedUrl } from '@/lib/utils/presigned-url-client';
import { Loader2 } from 'lucide-react';

interface DocumentViewerModalWithPresignedProps {
  fileKey: string;
  contentType?: string | undefined | null;
  icon?: React.ReactNode;
  label?: string;
}

/**
 * Wrapper component that fetches a presigned URL and then displays the document viewer modal
 */
export default function DocumentViewerModalWithPresigned({
  fileKey,
  contentType,
  icon,
  label,
}: DocumentViewerModalWithPresignedProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!fileKey) {
        setPresignedUrl(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const url = await getPresignedUrl(fileKey);
        setPresignedUrl(url);
      } catch (err) {
        console.error('Failed to get presigned URL:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [fileKey]);

  if (isLoading) {
    return (
      <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
        {icon}
        <Loader2 className="h-4 w-4 animate-spin" />
        {label || 'Loading...'}
      </span>
    );
  }

  if (error || !presignedUrl) {
    return (
      <span className="flex items-center gap-2 text-sm font-medium text-gray-400">
        {icon}
        {label || 'Document unavailable'}
      </span>
    );
  }

  return (
    <DocumentViewerModal
      documentUrl={presignedUrl}
      contentType={contentType}
      icon={icon}
      label={label}
    />
  );
}
