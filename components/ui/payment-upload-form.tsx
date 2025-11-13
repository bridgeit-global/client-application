'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from './use-toast';

interface UploadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    file: File | null;
    collectionDate: string;
    payableAmount: number;
    utrId?: string;
  }) => void;
}

const formatNumberWithCommas = (value: string | number) => {
  const numString = value.toString();
  if (numString.length <= 3) {
    return numString;
  }
  const lastThree = numString.slice(-3);
  const otherNumbers = numString.slice(0, -3);
  const formattedOtherNumbers = otherNumbers.replace(
    /\B(?=(\d{2})+(?!\d))/g,
    ','
  );
  return `${formattedOtherNumbers},${lastThree}`;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getTodayDate = () => formatDate(new Date());

const UploadFormModal: React.FC<UploadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [collectionDate, setCollectionDate] = React.useState<string>(() =>
    getTodayDate()
  );
  const [payableAmount, setPayableAmount] = React.useState<number | ''>('');
  const [utrId, setUtrId] = React.useState<string>('');

  const adjustCollectionDate = React.useCallback((days: number) => {
    setCollectionDate((prev) => {
      const baseDate = prev ? new Date(prev) : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      return formatDate(baseDate);
    });
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setCollectionDate((prev) => prev || getTodayDate());
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (
      selectedFile &&
      (selectedFile.type === 'text/html' ||
        selectedFile.type === 'application/pdf')
    ) {
      setFile(selectedFile);
    } else {
      alert('Please select an HTML or PDF file.');
      e.target.value = '';
    }
  };

  const handleSubmit = () => {


    if (Number(payableAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Collection Amount must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    if (collectionDate === '') {
      toast({
        title: 'Error',
        description: 'Collection Date is required',
        variant: 'destructive'
      });
      return;
    }

    const formData = {
      file: file || null,
      collectionDate,
      payableAmount:
        typeof payableAmount === 'string'
          ? Number(payableAmount)
          : payableAmount,
      utrId: utrId || undefined
    };

    onSubmit(formData);
    setFile(null);
    setCollectionDate(getTodayDate());
    setPayableAmount('');
    setUtrId('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Payment Details</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="mb-1 block">
              Upload File (HTML or PDF)
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".html,.pdf"
              onChange={handleFileChange}
              className="mb-2 w-full"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="collection-date" className="mb-1 block">
              Collection Date
            </Label>
            <div className="mb-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => adjustCollectionDate(-1)}
                aria-label="Previous collection date"
              >
                Prev
              </Button>
              <Input
                required
                id="collection-date"
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => adjustCollectionDate(1)}
                aria-label="Next collection date"
              >
                Next
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="payable-amount" className="mb-1 block">
              Collection Amount
            </Label>
            <Input
              required
              id="payable-amount"
              type="text"
              inputMode="decimal"
              value={
                payableAmount !== ''
                  ? formatNumberWithCommas(payableAmount)
                  : ''
              }
              onChange={(e) => {
                const inputValue = e.target.value.replace(/,/g, '');
                if (/^\d*\.?\d*$/.test(inputValue)) {
                  setPayableAmount(inputValue ? Number(inputValue) : '');
                }
              }}
              placeholder="Enter collection amount"
              className="mb-2 w-full"
            />
          </div>
          <div>
            <Label htmlFor="utr-id" className="mb-1 block">
              UTR ID (optional)
            </Label>
            <Input
              id="utr-id"
              type="text"
              value={utrId}
              onChange={(e) => setUtrId(e.target.value)}
              placeholder="Enter UTR ID (optional)"
              className="mb-2 w-full"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UploadFormModal;
