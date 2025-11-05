'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UploadDropzone } from '@/lib/uploadthing';
import { createClient } from '@/lib/supabase/client';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  id: string | undefined;
  amount: number;
}

const supabase = createClient();

export function UploadReceiptModal({
  isOpen,
  onClose,
  id,
  siteId,
  amount
}: UploadReceiptModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Upload Receipt
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-6">
          <p className="text-center text-muted-foreground">
            {siteId} paid amount of ₹{amount}
          </p>
          <UploadDropzone
            endpoint="receiptUploader"
            onClientUploadComplete={async (res) => {
              const bodyRes = res.map((r) => ({
                receipt_url: r.url,
                receipt_content_type: r.type.includes('pdf') ? 'pdf' : 'image'
              }));
              const resp_receipt = await supabase
                .from('bills')
                .update(bodyRes)
                .eq('id', id)
                .select();
              setIsUploading(false);
              toast({
                title: 'Upload complete',
                description: 'The manager has been notified.'
              });
              onClose();
            }}
            onUploadError={() => {
              setIsUploading(false);
              toast({
                title: 'Upload failed',
                description: 'Please try again.',
                variant: 'destructive'
              });
            }}
            onUploadBegin={() => {
              setIsUploading(true);
            }}
            className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90 ut-label:text-muted-foreground ut-upload-icon:text-muted-foreground"
          />
          <p className="text-sm text-muted-foreground">
            Manager will be notified.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
