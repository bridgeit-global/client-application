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

export function PDFViewer({ pdfUrl }: { pdfUrl: string }) {
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
      <div className="mt-10 md:mt-4" style={{ height: 'calc(100vh - 100px)' }}>
        <Viewer 
          fileUrl={pdfUrl} 
          plugins={[defaultLayoutPluginInstance]}
          renderError={renderError}
        />
      </div>
    </Worker>
  );
}

export function HTMLViewer({ htmlUrl }: { htmlUrl: string }) {
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
      style={{ height: 'calc(100vh - 100px)' }}
      className="items-center space-y-4 bg-background p-2 text-foreground sm:p-4"
    >
      <Button size="sm" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <div
        className="w-full overflow-auto rounded-lg border"
        style={{ height: 'calc(100vh - 120px)' }}
      >
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
