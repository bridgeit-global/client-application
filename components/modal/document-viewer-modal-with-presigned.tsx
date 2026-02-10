'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { getPresignedUrl } from '@/lib/utils/presigned-url-client';
import { Loader2, FileText } from 'lucide-react';
import { PDFViewer, HTMLViewer, ImageViewer } from './document-viewer-modal';

interface DocumentViewerModalWithPresignedProps {
  fileKey: string;
  contentType?: string | undefined | null;
  icon?: React.ReactNode;
  label?: string;
}

/**
 * Wrapper that shows a trigger (e.g. "View PDF"). Fetches presigned URL only when the user opens the modal (on click).
 */
export default function DocumentViewerModalWithPresigned({
  fileKey,
  contentType,
  icon,
  label,
}: DocumentViewerModalWithPresignedProps) {
  const [open, setOpen] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = useCallback(
    async (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) return;
      if (!fileKey) {
        setError('No document key');
        return;
      }
      if (presignedUrl) return;

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
    },
    [fileKey, presignedUrl]
  );

  const getIcon = () => {
    if (icon) return icon;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="cursor-pointer hover:text-blue-500" asChild>
        <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
          {getIcon()}
          {label || 'View document'}
        </span>
      </DialogTrigger>
      <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        ) : presignedUrl ? (
          contentType === 'pdf' ? (
            <PDFViewer pdfUrl={presignedUrl} />
          ) : contentType === 'html' ? (
            <HTMLViewer htmlUrl={presignedUrl} />
          ) : contentType === 'image' ? (
            <ImageViewer imageUrl={presignedUrl} />
          ) : (
            <PDFViewer pdfUrl={presignedUrl} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
