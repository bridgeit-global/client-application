'use client';

import { FileSpreadsheet, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { UploadDropzone } from '@/lib/uploadthing';
import { UploadedFileData } from 'uploadthing/types';

const EXCEL_MAX_LIMIT = 5; // Adjust this value as needed

interface ExcelUploadProps {
  onChange: (value: any[]) => void;
  onRemove: (value: any[]) => void;
  value: any[];
}

export default function ExcelFileUpload({
  onChange,
  onRemove,
  value
}: ExcelUploadProps) {
  const { toast } = useToast();

  const onDeleteFile = (key: string) => {
    const filteredFiles = value.filter((item) => item.key !== key);
    onRemove(filteredFiles);
  };

  const onUpdateFile = (newFiles: UploadedFileData[]) => {
    onChange([...value, ...newFiles]);
  };

  return (
    <div>
      <div>
        {value.length < EXCEL_MAX_LIMIT && (
          <UploadDropzone
            className="ut-label:text-sm  ut-allowed-content:ut-uploading:text-red-300 py-2 dark:bg-zinc-800"
            endpoint="excelUploader"
            config={{ mode: 'auto' }}
            content={{
              allowedContent({ isUploading }) {
                if (isUploading) {
                  return (
                    <p className="mt-2 animate-pulse text-sm text-slate-400">
                      Excel file uploading...
                    </p>
                  );
                }
                return (
                  <p className="mt-2 text-sm text-slate-400">
                    Drag and drop or click to upload Excel files
                  </p>
                );
              }
            }}
            onClientUploadComplete={(res) => {
              if (res) {
                onUpdateFile(res);
              }
            }}
            onUploadError={(error: Error) => {
              toast({
                title: 'Error in excel upload',
                variant: 'destructive',
                description: error.message
              });
            }}
          />
        )}
      </div>

      <div className="my-4 flex items-center gap-4">
        {value.map((item) => (
          <div
            key={item.key}
            className="relative flex h-16 w-64 items-center overflow-hidden rounded-md border border-gray-200 bg-white p-2"
          >
            <FileSpreadsheet className="h-8 w-8 text-green-500" />
            <span className="ml-2 flex-1 truncate text-sm">{item.name}</span>
            <Button
              type="button"
              onClick={() => onDeleteFile(item.key)}
              variant="destructive"
              size="sm"
              className="absolute right-2"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
