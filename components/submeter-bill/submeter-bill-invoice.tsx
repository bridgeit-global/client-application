import React from 'react';
import { cn } from '@/lib/utils';

type BankDetailsProps = {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  ifscCode: string;
  operatorMobileNumber: string;
};

type ConsumerDetailsProps = {
  stationId: string;
  operatorName: string;
  meterNo: string;
  tariff: string;
  billingPeriod: string;
  billNumber: string;
};

type BillingSummaryProps = {
  startReading: number;
  endReading: number;
  unitsConsumed: number;
  amountPayable: number;
};

export type SubmeterBillInvoiceProps = {
  bankDetails: BankDetailsProps;
  consumerDetails: ConsumerDetailsProps;
  billingSummary: BillingSummaryProps;
  className?: string;
};

export function SubmeterBillInvoice({
  bankDetails,
  consumerDetails,
  billingSummary,
  className
}: SubmeterBillInvoiceProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-3xl bg-white p-8 text-sm text-slate-900',
        'border border-slate-200 shadow-sm',
        className
      )}
    >
      <div className="mb-8 border-b border-slate-200 pb-4 text-center">
        <h1 className="text-xl font-semibold tracking-wide">
          Submeter Electricity Bill Invoice
        </h1>
      </div>

      {/* Consumer Bank Details */}
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Consumer Bank Details
        </h2>
        <div className="overflow-hidden rounded border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium">
                  Bank Name
                </td>
                <td className="px-3 py-2">{bankDetails.bankName}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Bank Account Number
                </td>
                <td className="px-3 py-2">
                  {bankDetails.bankAccountNumber || '-'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Bank Account Holder Name
                </td>
                <td className="px-3 py-2">
                  {bankDetails.bankAccountHolderName || '-'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">IFSC Code</td>
                <td className="px-3 py-2">{bankDetails.ifscCode || '-'}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Operator Mobile Number
                </td>
                <td className="px-3 py-2">
                  {bankDetails.operatorMobileNumber || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Consumer Details */}
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Consumer Details
        </h2>
        <div className="overflow-hidden rounded border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium">
                  Station ID
                </td>
                <td className="px-3 py-2">{consumerDetails.stationId}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Operator Name
                </td>
                <td className="px-3 py-2">
                  {consumerDetails.operatorName || '-'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Meter No.
                </td>
                <td className="px-3 py-2">{consumerDetails.meterNo}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">₹ Tariff</td>
                <td className="px-3 py-2">{consumerDetails.tariff}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Billing Period
                </td>
                <td className="px-3 py-2">
                  {consumerDetails.billingPeriod}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Bill Number
                </td>
                <td className="px-3 py-2">{consumerDetails.billNumber}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Billing Summary */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">
          Billing Summary
        </h2>
        <div className="overflow-hidden rounded border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium">
                  Start Reading
                </td>
                <td className="px-3 py-2">
                  {billingSummary.startReading.toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  End Reading
                </td>
                <td className="px-3 py-2">
                  {billingSummary.endReading.toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Units Consumed
                </td>
                <td className="px-3 py-2">
                  {billingSummary.unitsConsumed.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 px-3 py-2 font-medium">
                  Amount Payable
                </td>
                <td className="px-3 py-2 font-semibold">
                  ₹ {billingSummary.amountPayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

