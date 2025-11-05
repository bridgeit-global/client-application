import type React from 'react';
import { calculatePayableAmount } from '@/lib/utils';
import { AllBillTableProps } from '@/types/bills-type';

interface PayableAmountDisplayProps {
  billData: AllBillTableProps;
}

export const PayableAmountDisplay: React.FC<PayableAmountDisplayProps> = ({
  billData
}) => {
  const { originalAmount, appliedRebate, rebateType, finalAmount } =
    calculatePayableAmount(billData);

  return (
    <div className="bg-white p-4 ">
      <h2 className="mb-4 text-lg font-semibold">Payable Amount Calculation</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Original Bill Amount:</span>
          <span className="text-sm font-medium">{originalAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Applied Rebate ({rebateType}):</span>
          <span className="text-sm font-medium text-green-600">
            - {appliedRebate}
          </span>
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-sm">Final Payable Amount:</span>
            <span className="text-sm font-medium">{finalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
