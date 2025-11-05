'use client';

import { useState, useEffect, useCallback } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../ui/loading-spinner';
import { formatRupees } from '@/lib/utils/number-format';
import { TransactionInput } from '../input/transaction-input';
import { useToast } from '@/components/ui/use-toast';
import { useTransactionInput } from '@/hooks/use-transaction-input';

// Types
interface PaymentFormData {
  transactionReference: string;
  paymentMode: string;
  remarks: string;
  amount: number | '';
  transactionDate: string;
}

interface UploadBatchReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  amount?: number;
  description?: string;
  payBills: (props: {
    transactionReference: string;
    paymentMode: string;
    remarks: string;
    amount?: number;
    transactionDate?: string;
  }) => void;
  loading?: boolean;
}



const validateAmount = (value: string): number | '' => {
  if (value === '') return '';
  const numValue = Number(value);
  return isNaN(numValue) || numValue < 0 ? '' : numValue;
};

export function UploadBatchReceiptModal({
  isOpen,
  onClose,
  id,
  amount,
  payBills,
  loading = false,
  description
}: UploadBatchReceiptModalProps) {
  const { toast } = useToast();
  const { validateTransactionId } = useTransactionInput({});
  // State management
  const [formData, setFormData] = useState<PaymentFormData>({
    transactionReference: '',
    paymentMode: 'NEFT',
    remarks: '',
    amount: '',
    transactionDate: ''
  });


  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        transactionReference: '',
        paymentMode: 'NEFT',
        remarks: '',
        amount: '',
        transactionDate: ''
      });
    }
  }, [isOpen]);


  // Event handlers
  const handleInputChange = useCallback((field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    const validatedAmount = validateAmount(value);
    setFormData(prev => ({ ...prev, amount: validatedAmount }));
  }, []);

  const handleReferenceChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, transactionReference: value }));
  }, []);

  const handlePaymentModeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, paymentMode: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const finalAmount = amount || Number(formData.amount);
    const isErrorTransactionId = validateTransactionId(formData.transactionReference, formData.paymentMode);
    if (isErrorTransactionId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invalid transaction ID format",
      });
      return;
    }
    payBills({
      transactionReference: formData.transactionReference,
      paymentMode: formData.paymentMode,
      remarks: formData.remarks,
      amount: finalAmount,
      transactionDate: formData.transactionDate || new Date().toISOString().slice(0, 10)
    });
    onClose();
  }, [amount, formData, payBills, onClose]);

  // Computed values
  const isFormValid = Boolean(
    formData.transactionReference.trim() &&
    formData.transactionDate &&
    (amount || formData.amount) &&
    formData.transactionReference.trim() &&
    formData.paymentMode
  );


  const renderAmountSection = () => (
    <div className="bg-muted p-4 rounded-lg w-full">
      {id && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Batch ID:</span>
          <span className="font-mono text-sm">{id}</span>
        </div>
      )}
      {amount ? (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium">Amount Paid:</span>
          <span className="text-lg font-semibold">{formatRupees(amount)}</span>
        </div>
      ) : (
        <div className="flex flex-col mt-2">
          <label className="text-sm font-medium mb-1">Amount Paid</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full"
            min={0}
          />
        </div>
      )}
    </div>
  );

  const renderPaymentModeSection = () => (
    <div className="w-full">
      <TransactionInput
        transactionId={formData.transactionReference}
        paymentMethod={formData.paymentMode}
        onTransactionIdChange={handleReferenceChange}
        onPaymentMethodChange={handlePaymentModeChange}
      />
    </div>
  );



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Make Payment
          </DialogTitle>
          {
            description && (
              <DialogDescription className="underline text-red-500 text-center">
                {description}
              </DialogDescription>
            )
          }
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-8">
          {renderAmountSection()}
          {renderPaymentModeSection()}
          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Transaction Date</label>
            <Input
              type="date"
              value={formData.transactionDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => handleInputChange('transactionDate', e.target.value)}
              className="w-full"
            />
          </div>
          <Input
            placeholder="Remarks (optional)"
            value={formData.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            className="w-full"
          />
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading || !isFormValid}
          >
            {loading && <LoadingSpinner size={20} className="mr-2" />}
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
