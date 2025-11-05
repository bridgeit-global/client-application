'use client';

import React, { useState } from 'react';
import { Heading } from '@/components/ui/heading';
import { UploadDropzone } from '@/lib/uploadthing';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
export default function PDFLogsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const handleClientUploadComplete = async (
    res: { url: string; type: string }[]
  ) => {
    setIsLoading(true);
    const body = res.map((r) => ({
      pdf_url: r.url,
      file_type: r.type.includes('html') ? 'html' : 'pdf'
    }));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/verify/pdf-trigger`,
        body
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        if (response.data[0]['$metadata']['httpStatusCode'] === 200) {
          toast({
            variant: 'success',
            title: 'Success',
            description: 'Files uploaded successfully'
          });
        } else {
          toast({
            title: 'Error',
            variant: 'destructive',
            description: 'Upload failed. Please try again.'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'An error occurred during upload'
      });
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: 'Error',
      variant: 'destructive',
      description: `Upload failed: ${error.message}`
    });
  };

  return (
    <>
      <Heading
        title="Bill Upload"
        description="Upload and manage your PDF and HTML files"
      />
      <div className="mt-6">
        <UploadDropzone
          disabled={isLoading}
          endpoint="multiFormatUploader"
          onClientUploadComplete={handleClientUploadComplete}
          onUploadError={handleUploadError}
          className="ut-button:bg-primary ut-button:hover:bg-primary/90 ut-label:text-lg ut-allowed-content:text-muted-foreground"
        />
      </div>
    </>
  );
}
