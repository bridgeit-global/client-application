import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadIcon } from 'lucide-react';

interface UploadCardProps {
  children: React.ReactNode;
}
export function UploadCard({ children }: UploadCardProps) {
  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <UploadIcon className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Upload PDF or HTML Files</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Drag and drop your files here or click to browse
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
