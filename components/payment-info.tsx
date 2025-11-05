import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from 'lucide-react';
import { formatRupees } from '@/lib/utils/number-format';

interface PaymentInfoProps {
  amount: number;
  billAmount: number;
}

export const PaymentInfo: React.FC<PaymentInfoProps> = ({
  amount,
  billAmount
}) => {
  const difference = amount - billAmount;
  const isOverpaid = difference > 0;
  const isFullyPaid = difference === 0;

  const getStatusColor = () => {
    if (isOverpaid) return 'text-yellow-500';
    if (isFullyPaid) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (isOverpaid) return <ArrowUpIcon className="mr-1 h-4 w-4" />;
    if (isFullyPaid) return <CheckCircleIcon className="mr-1 h-4 w-4" />;
    return <ArrowDownIcon className="mr-1 h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isOverpaid) return 'Overpaid';
    if (isFullyPaid) return 'Fully Paid';
    return 'Saving';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="font-semibold">
              {formatRupees(Math.abs(difference))}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>
              <strong>Payment:</strong> {formatRupees(amount)}
            </p>
            <p>
              <strong>Bill Amount:</strong> {formatRupees(billAmount)}
            </p>
            <p>
              <strong>Status:</strong> {getStatusText()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
