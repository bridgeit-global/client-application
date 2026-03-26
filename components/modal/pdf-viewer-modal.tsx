'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, LucideProps } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { cn } from '@/lib/utils';

export type DocumentViewerLayout = 'page' | 'embedded';

const PAGE_VIEWER_HEIGHT = 'calc(100vh - 100px)';

export function PDFViewer({
  pdfUrl,
  layout = 'page'
}: {
  pdfUrl: string;
  layout?: DocumentViewerLayout;
}) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const renderError = (error: any) => {
    console.error('PDF Viewer error:', error);
    
    let message = 'Failed to load PDF document';
    if (error.name === 'UnexpectedResponseException') {
      message = 'Failed to fetch PDF. This may be due to CORS configuration or network issues.';
    } else if (error.name === 'MissingPDFException') {
      message = 'PDF document not found.';
    } else if (error.name === 'InvalidPDFException') {
      message = 'The PDF document is invalid or corrupted.';
    } else if (error.message) {
      message = error.message;
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4 max-w-md">
          <p className="text-red-500 mb-2 font-semibold">Failed to fetch</p>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          <p className="text-xs text-muted-foreground break-all">
            Error: {error.name || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Worker workerUrl="/pdf.worker.min.js">
      <div
        className={cn(
          'w-full overflow-hidden',
          layout === 'page' && 'mt-10 md:mt-4',
          layout === 'embedded' &&
            'mt-0 h-[min(70vh,560px)] min-h-[480px] max-h-[560px]'
        )}
        style={
          layout === 'page' ? { height: PAGE_VIEWER_HEIGHT } : undefined
        }
      >
        <Viewer
          fileUrl={pdfUrl}
          plugins={[defaultLayoutPluginInstance]}
          renderError={renderError}
        />
      </div>
    </Worker>
  );
}

export function HTMLViewer({
  htmlUrl,
  layout = 'page'
}: {
  htmlUrl: string;
  layout?: DocumentViewerLayout;
}) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        const response = await fetch(htmlUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch HTML');
        }
        const html = await response.text();
        setHtmlContent(html);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load HTML file');
        setIsLoading(false);
      }
    };

    fetchHtml();
  }, [htmlUrl]);

  const handleDownload = async () => {
    try {
      const response = await fetch(htmlUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = htmlUrl.split('/').pop() || 'document.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML:', error);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-background p-2 text-foreground sm:p-4',
        layout === 'page' && 'items-center space-y-4',
        layout === 'embedded' &&
          'h-[min(70vh,560px)] min-h-[480px] max-h-[560px] space-y-2'
      )}
      style={layout === 'page' ? { height: PAGE_VIEWER_HEIGHT } : undefined}
    >
      <Button size="sm" onClick={handleDownload} className="shrink-0 self-start">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <div className="w-full min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <iframe
            srcDoc={htmlContent}
            title="HTML Viewer"
            className="h-full w-full"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
}

export default function PDFViewerModal({
  pdfUrl,
  contentType = 'pdf',
  icon = <FileText />,
  label
}: {
  pdfUrl: string;
  contentType?: string;
  icon?: any;
  label?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer hover:text-blue-500" asChild>
        <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
          {' '}
          {icon}
          {label ? label : ''}
        </span>
      </DialogTrigger>
      <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2 sm:p-6">
        {pdfUrl ? (
          contentType == 'pdf' ? (
            <PDFViewer pdfUrl={pdfUrl} />
          ) : (
            <HTMLViewer htmlUrl={pdfUrl} />
          )
        ) : (
          <div className="p-4">No URL available</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
