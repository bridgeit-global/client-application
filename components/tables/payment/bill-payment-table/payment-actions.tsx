'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientPaymentsProps } from '@/types/payments-type';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store/user-store';
import { CreditCard, IndianRupee, ArrowLeftRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { formatRupees } from '@/lib/utils/number-format';
import { createClient } from '@/lib/supabase/client';
import { FormField } from '@/components/input/form-field';
import { TransactionInput } from '@/components/input/transaction-input';
import { useTransactionInput } from '@/hooks/use-transaction-input';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { Checkbox } from '@/components/ui/checkbox';

const DELAY_TIME = 3000;
interface PaymentActionsProps {
  data: ClientPaymentsProps;
}



const buttonStyles = {
  base: cn(
    "text-white font-medium",
    "transition-colors duration-200",
    "flex items-center gap-1.5",
    "min-w-[100px] max-w-[120px]",
    "h-7 px-2.5 py-0.5 text-xs", // Even more compact
    "whitespace-nowrap"
  ),
  payment: cn(
    "bg-emerald-600 hover:bg-emerald-700",
  ),
  amountChange: cn(
    "bg-blue-600 hover:bg-blue-700",
  ),
  reversal: cn(
    "bg-orange-500 hover:bg-orange-600",
  ),
  paymentFailed: cn(
    "bg-red-600 hover:bg-red-700",
  ),
};

const ActionButtons = ({ children }: { children: React.ReactNode }) => {
  // Check if there's only one button by counting the number of child elements
  const childrenArray = React.Children.toArray(children);
  const isSingleButton = childrenArray.length === 1;

  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 pr-2 py-1 min-h-[32px] w-full",
      isSingleButton ? "justify-center" : "justify-center"
    )}>
      {children}
    </div>
  );
};

export function PaymentActions({ data }: PaymentActionsProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useUserStore();
  const router = useRouter();
  const { validateTransactionId } = useTransactionInput({});
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false);
  const [isAmountChangeDialogOpen, setIsAmountChangeDialogOpen] = useState(false);
  const [isPaymentFailedDialogOpen, setIsPaymentFailedDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingReversal, setIsProcessingReversal] = useState(false);
  const [isProcessingAmountChange, setIsProcessingAmountChange] = useState(false);
  const [isProcessingPaymentFailed, setIsProcessingPaymentFailed] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    amount: data.bill_amount?.toString() || '',
    transactionId: '',
    paymentMethod: 'NEFT',
    file: null,
    remarks: '',
    isPaid: false,
    refId: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [reversalInfo, setReversalInfo] = useState({
    amount: data.paid_amount?.toString() || '',
    transactionId: '',
    paymentMethod: 'NEFT',
    remarks: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [amountChangeInfo, setAmountChangeInfo] = useState({
    amount: data.bill_amount?.toString() || '',
    remarks: ''
  });
  const [paymentFailedInfo, setPaymentFailedInfo] = useState({
    remarks: ''
  });
  const [paymentFailedRemarks, setPaymentFailedRemarks] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentInfo(prev => ({ ...prev, file: file as any }));
    }
  };

  const getPaymentFailedRemarks = async () => {
    const { data, error } = await supabase.from('master').select('name').eq('type', 'payment_failed_remarks');
    if (error) {
      console.error('Error fetching payment failed remarks:', error);
    }
    setPaymentFailedRemarks(data?.map((item: any) => item.name) || []);
  }

  useEffect(() => {
    getPaymentFailedRemarks();
  }, []);

  useEffect(() => {
    setPaymentInfo({
      amount: data.bill_amount?.toString() || '',
      transactionId: '',
      paymentMethod: 'NEFT',
      remarks: '',
      file: null,
      isPaid: false,
      refId: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setReversalInfo({
      amount: data.paid_amount?.toString() || '',
      transactionId: '',
      paymentMethod: 'NEFT',
      remarks: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setAmountChangeInfo({
      amount: data.bill_amount?.toString() || '',
      remarks: ''
    });
    setPaymentFailedInfo({
      remarks: ''
    });
  }, [data]);

  useEffect(() => {
    if (!isPaymentDialogOpen) {
      setPaymentInfo({
        amount: data.bill_amount?.toString() || '',
        transactionId: '',
        paymentMethod: 'NEFT',
        file: null,
        isPaid: false,
        refId: '',
        remarks: '',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      setIsProcessingPayment(false);
      // Clear validation errors when dialog closes
    }
  }, [isPaymentDialogOpen, data]);

  useEffect(() => {
    if (!isReversalDialogOpen) {
      setReversalInfo({
        amount: data.paid_amount?.toString() || '',
        transactionId: '',
        paymentMethod: 'NEFT',
        remarks: '',
        transactionDate: new Date().toISOString().split('T')[0]
      });
      setIsProcessingReversal(false);
      // Clear validation errors when dialog closes
    }
  }, [isReversalDialogOpen, data]);

  useEffect(() => {
    if (!isAmountChangeDialogOpen) {
      setAmountChangeInfo({
        amount: data.bill_amount?.toString() || '',
        remarks: ''
      });
      setIsProcessingAmountChange(false);
    }
  }, [isAmountChangeDialogOpen, data]);

  useEffect(() => {
    if (!isPaymentFailedDialogOpen) {
      setPaymentFailedInfo({
        remarks: ''
      });
      setIsProcessingPaymentFailed(false);
    }
  }, [isPaymentFailedDialogOpen, data]);

  const API_URL = process.env.NEXT_PUBLIC_UPLOAD_PDF_URL || '';

  const refreshPage = () => {
    router.refresh();
  };

  const handleInsertPayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Validate required fields
      if (!paymentInfo.amount || !paymentInfo.transactionId || !paymentInfo.paymentMethod) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Amount, Payment Method, and Transaction ID are required",
        });
        return;
      }
      // Validate payment reference with method
      const isErrorTransactionId = validateTransactionId(paymentInfo.transactionId, paymentInfo.paymentMethod);
      if (isErrorTransactionId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Invalid transaction ID format",
        });
        return;
      }


      let receiptUrl = null;
      let content = null;
      let paymentReceiptId = null;
      let content_type = '';
      const connection_id = data?.bills?.connections?.id || data?.prepaid_recharge?.connections?.id;
      if (paymentInfo.file) {
        const id = `${connection_id}_${paymentInfo.transactionDate.replace(/-/g, '')}`;
        const [billerId, , collectionDate] = id.split('_');
        // Convert file to base64
        const base64File = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(paymentInfo.file!);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
        // Extract content type and base64 content
        const [, contentType, base64Content] = base64File.match(/^data:(.+);base64,(.+)$/) || [];
        content_type = contentType.split('/')[1];
        const body = { id, contentType, base64Content, receiptType: 'system' };
        await axios.post(`${API_URL}/payment/receipt_upload`, body);
        receiptUrl = `system-payment-receipt/${billerId}/${collectionDate}/${id}.${content_type}`;

        // If the bill is marked as paid, upload the receipt to the payment table
        if (paymentInfo.isPaid) {
          const paymentBody = { id, contentType, base64Content };
          await axios.post(`${API_URL}/payment/receipt_upload`, paymentBody);
          content = `payment-receipt/${billerId}/${collectionDate}/${id}.${content_type}`;
          paymentReceiptId = id;
        }
      }

      const response = await fetch(`${API_URL}/payment/bill-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single_bill_payment',
          userId: user?.id,
          paymentDetails: {
            billId: data.bill_id,
            batchId: data.batch_id,
            rechargeId: data.recharge_id,
            batch_transaction_reference: data.id,
            transaction_reference: paymentInfo.transactionId,
            payment_method: paymentInfo.paymentMethod,
            amount: parseFloat(paymentInfo.amount),
            transactionDate: paymentInfo.transactionDate,
            remarks: paymentInfo.remarks,
            receiptUrl: receiptUrl
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }
      // Add fake timeout for 3 seconds after API call
      await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

      if (paymentInfo.isPaid) {
        const dataWithRow = {
          id: paymentReceiptId,
          connection_id: connection_id,
          reference_id: paymentInfo.refId,
          amount: paymentInfo.amount,
          collection_date: paymentInfo.transactionDate,
          content: content ? content : null,
          content_type: content_type
        };

        const { count, error: paymentError } = await supabase
          .from('payments')
          .select('id', { count: 'exact' })
          .eq('id', dataWithRow.id)
        if (paymentError) throw paymentError;
        if (count === 0) {
          const { error: insertError } = await supabase
            .from('payments')
            .insert([{ ...dataWithRow, created_by: user?.id }]);
          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase
            .from('payments')
            .update({ ...dataWithRow, updated_by: user?.id })
            .eq('id', dataWithRow.id);
          if (updateError) throw updateError;
        }

        if (data.bills && data.bill_id) {
          const { error: updateError1 } = await supabase
            .from('bills')
            .update({ payment_status: true })
            .eq('id', data.bill_id)
          if (updateError1) throw updateError1;
        }
      }

      toast({
        title: "Payment Successful",
        description: "The payment has been processed successfully.",
        variant: "default",
      });
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
      });
    } finally {
      refreshPage();
      setIsProcessingPayment(false);
    }
  };

  const handleReversalMark = async () => {
    try {
      setIsProcessingReversal(true);

      // Validate required fields
      if (!reversalInfo.amount || !reversalInfo.transactionId || !reversalInfo.paymentMethod) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Amount, Payment Method, and Transaction ID are required",
        });
        return;
      }

      // Validate payment reference with method
      const isErrorTransactionId = validateTransactionId(reversalInfo.transactionId, reversalInfo.paymentMethod);
      if (isErrorTransactionId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Invalid transaction ID format",
        });
        return;
      }

      const response = await fetch(`${API_URL}/payment/bill-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single_reversal_payment',
          userId: user?.id,
          paymentDetails: {
            rechargeId: data.recharge_id,
            batchId: data.batch_id,
            billId: data.bill_id,
            batch_transaction_reference: data.id,
            transaction_reference: reversalInfo.transactionId,
            payment_method: reversalInfo.paymentMethod,
            refund_amount: data.paid_amount || 0,
            transactionDate: reversalInfo.transactionDate,
            remarks: reversalInfo.remarks
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Reversal failed');
      }

      // Add fake timeout for 5 seconds after API call
      await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

      toast({
        title: "Reversal Successful",
        description: "The payment has been reversed successfully.",
        variant: "default",
      });
      setIsReversalDialogOpen(false);
    } catch (error) {
      console.error('Error marking reversal:', error);
      toast({
        variant: "destructive",
        title: "Reversal Failed",
        description: "There was an error processing the reversal. Please try again.",
      });
    } finally {
      refreshPage();
      setIsProcessingReversal(false);
    }
  };

  const handleAmountChange = async () => {
    try {
      setIsProcessingAmountChange(true);
      if (!amountChangeInfo.amount) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "New amount is required",
        });
        return;
      }
      // Prevent update if new amount is the same as current amount
      if (parseFloat(amountChangeInfo.amount) === data.bill_amount) {
        toast({
          variant: "default",
          title: "No Change",
          description: "The new amount is the same as the current amount. No update performed.",
        });
        setIsAmountChangeDialogOpen(false);
        return;
      }
      const updatedAmount = parseFloat(amountChangeInfo.amount);
      const clientPaidAmount = (data.client_paid_amount || 0) || (data.bills.approved_amount || 0);
      const refundAmount = clientPaidAmount > updatedAmount ? clientPaidAmount - updatedAmount : 0
      if (refundAmount && data.bills.bill_status === 'batch') {
        const { error } = await supabase.from('bills').update({
          approved_amount: updatedAmount,
        }).eq('id', data.bill_id);
        if (error) {
          throw new Error(error.message || 'Failed to update bill amount');
        }
      }

      const response = await fetch(`${API_URL}/payment/bill-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single_bill_amount_change_payment',
          userId: user?.id,
          paymentDetails: {
            billId: data.bill_id,
            rechargeId: data.recharge_id,
            batchId: data.batch_id,
            batch_transaction_reference: data.id,
            amount: updatedAmount,
            refundAmount: refundAmount,
            billStatus: data.bills.bill_status,
            remarks: amountChangeInfo.remarks
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Amount change failed');
      }

      // Add fake timeout for 5 seconds after API call
      await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

      toast({
        title: "Amount Updated",
        description: "The bill amount has been updated successfully.",
        variant: "default",
      });
      setIsAmountChangeDialogOpen(false);
    } catch (error) {
      console.error('Error updating bill amount:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was an error updating the amount. Please try again.",
      });
    } finally {
      refreshPage();
      setIsProcessingAmountChange(false);
    }
  };

  const handlePaymentFailed = async () => {
    try {
      setIsProcessingPaymentFailed(true);

      // Add fake timeout for 5 seconds after API call
      await new Promise(resolve => setTimeout(resolve, DELAY_TIME));

      const response = await fetch(`${API_URL}/payment/bill-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single_payment_failed',
          userId: user?.id,
          paymentDetails: {
            billId: data.bill_id,
            rechargeId: data.recharge_id,
            refundAmount: data.client_paid_amount || 0,
            batchId: data.batch_id,
            batch_transaction_reference: data.id,
            remarks: paymentFailedInfo.remarks
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed marking failed');
      }

      toast({
        title: "Payment Marked as Failed",
        description: "The payment has been marked as failed successfully.",
        variant: "default",
      });
      setIsPaymentFailedDialogOpen(false);
    } catch (error) {
      console.error('Error marking payment as failed:', error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: "There was an error marking the payment as failed. Please try again.",
      });
    } finally {
      refreshPage();
      setIsProcessingPaymentFailed(false);
    }
  };
  // For new payments, show both Insert Payment and Amount Change buttons
  if (data.status === 'unpaid') {
    return (
      <ActionButtons>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={cn(buttonStyles.base, buttonStyles.payment)}
            >
              {isProcessingPayment ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-3 w-3" />
                  <span>Payment</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Process Payment</DialogTitle>
              <DialogDescription>
                Enter the payment details for this bill. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className='text-md font-semibold' >Bill Amount :  {formatRupees(paymentInfo.amount)}</div>
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
                {paymentInfo.file && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {(paymentInfo?.file as any)?.name}
                  </p>
                )}
              </div>
              <TransactionInput
                transactionId={paymentInfo.transactionId}
                paymentMethod={paymentInfo.paymentMethod}
                onTransactionIdChange={(value) => setPaymentInfo(prev => ({ ...prev, transactionId: value }))}
                onPaymentMethodChange={(value) => setPaymentInfo(prev => ({ ...prev, paymentMethod: value }))}
                required={true}
              />
              <FormField
                label="Date"
                id="transactionDate"
                type="date"
                value={paymentInfo.transactionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentInfo(prev => ({ ...prev, transactionDate: e.target.value }))}
                required
              />
              <FormField
                label="Ref ID"
                id="refId"
                value={paymentInfo.refId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentInfo(prev => ({ ...prev, refId: e.target.value }))}
                placeholder="Enter ref ID (optional)"
              />
              <FormField
                label="Remarks"
                id="remarks"
                value={paymentInfo.remarks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPaymentInfo(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Add any additional notes"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="markBillAsPaid"
                  checked={paymentInfo.isPaid}
                  onCheckedChange={(checked) => setPaymentInfo(prev => ({ ...prev, isPaid: checked as boolean }))}

                />
                <Label htmlFor="markBillAsPaid" className="text-right text-sm font-medium">Mark Bill as Paid</Label>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInsertPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  'Process Payment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {data?.bill_id ?
          <Dialog open={isAmountChangeDialogOpen} onOpenChange={setIsAmountChangeDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className={cn(buttonStyles.base, buttonStyles.amountChange)}
              >
                {isProcessingAmountChange ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <IndianRupee className="h-3 w-3" />
                    <span>Update</span>
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Update Bill Amount</DialogTitle>
                <DialogDescription>
                  Enter the new amount for this bill. Current amount: {formatRupees(data.bill_amount)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <FormField
                  label="New Amount"
                  id="newAmount"
                  type="number"
                  value={amountChangeInfo.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAmountChangeInfo(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter new amount"
                  required
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsAmountChangeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAmountChange}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isProcessingAmountChange}
                >
                  {isProcessingAmountChange ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Processing...
                    </>
                  ) : (
                    'Update Amount'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> : null
        }

        <Dialog open={isPaymentFailedDialogOpen} onOpenChange={setIsPaymentFailedDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={cn(buttonStyles.base, buttonStyles.paymentFailed)}
            >
              {isProcessingPaymentFailed ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Processing...
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  <span>Failed</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Mark Payment as Failed</DialogTitle>
              <DialogDescription>
                Mark this payment as failed. This will update the payment status.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentFailedRemarks" className="text-right text-sm font-medium">
                  Remarks
                </Label>
                <div className="col-span-3">
                  <Select
                    value={paymentFailedInfo.remarks}
                    onValueChange={(value) =>
                      setPaymentFailedInfo(prev => ({ ...prev, remarks: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason for marking as failed" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentFailedRemarks.map((remark) => (
                        <SelectItem key={remark} value={remark}>{remark}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPaymentFailedDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePaymentFailed}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isProcessingPaymentFailed}
              >
                {isProcessingPaymentFailed ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  'Mark as Failed'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ActionButtons>
    );
  }

  // For paid payments, show Reversal button
  if (data.status === 'paid') {
    return (
      <ActionButtons>
        <Dialog open={isReversalDialogOpen} onOpenChange={setIsReversalDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className={cn(buttonStyles.base, buttonStyles.reversal)}
            >
              {isProcessingReversal ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Processing...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>Reversal</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Process Reversal</DialogTitle>
              <DialogDescription>
                Enter the reversal details for this payment. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className='text-md font-semibold' >Bill Amount :  {formatRupees(data.paid_amount)}</div>
              <TransactionInput
                transactionId={reversalInfo.transactionId}
                paymentMethod={reversalInfo.paymentMethod}
                onTransactionIdChange={(value) => setReversalInfo(prev => ({ ...prev, transactionId: value }))}
                onPaymentMethodChange={(value) => setReversalInfo(prev => ({ ...prev, paymentMethod: value }))}
                required={true}
              />
              <FormField
                label="Date"
                id="reversalTransactionDate"
                type="date"
                value={reversalInfo.transactionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReversalInfo(prev => ({ ...prev, transactionDate: e.target.value }))}
                required
              />
              <FormField
                label="Remarks"
                id="reversalRemarks"
                value={reversalInfo.remarks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReversalInfo(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Reason for reversal"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsReversalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReversalMark}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isProcessingReversal}
              >
                {isProcessingReversal ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  'Process Reversal'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ActionButtons>
    );
  }

  // For reversed or refunded payments, return empty container for consistent height
  if (data.status === 'reverse' || data.status === 'refund') {
    return <div className="min-h-[32px]" />;
  }

  return null;
}