import React from 'react';

function formatBillingPeriod(raw: string): string {
  const parts = raw.split(' to ');
  if (parts.length !== 2) return raw;
  const fmt = (s: string) => {
    const d = new Date(s + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  return `${fmt(parts[0])} to ${fmt(parts[1])}`;
}

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

const cellLabel: React.CSSProperties = {
  width: '40%',
  backgroundColor: '#f8fafc',
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: '13px',
  color: '#1e293b',
  borderBottom: '1px solid #e2e8f0',
};

const cellValue: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '13px',
  color: '#334155',
  borderBottom: '1px solid #e2e8f0',
};

const sectionHeading: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1e3a5f',
  marginBottom: '8px',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #e2e8f0',
};

function InvoiceRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}) {
  const lStyle = isLast ? { ...cellLabel, borderBottom: 'none' } : cellLabel;
  const vStyle = isLast ? { ...cellValue, borderBottom: 'none' } : cellValue;
  return (
    <tr>
      <td style={lStyle}>{label}</td>
      <td style={vStyle}>{value}</td>
    </tr>
  );
}

export function SubmeterBillInvoice({
  bankDetails,
  consumerDetails,
  billingSummary,
}: SubmeterBillInvoiceProps) {
  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '60px 56px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1e293b',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          paddingBottom: '20px',
          marginBottom: '32px',
          borderBottom: '2px solid #1e3a5f',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: '#1e293b',
            margin: 0,
          }}
        >
          Submeter Electricity Bill Invoice
        </h1>
      </div>

      {/* Consumer Details */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={sectionHeading}>Consumer Details</h2>
        <table style={tableStyle}>
          <tbody>
            <InvoiceRow label="Station ID" value={consumerDetails.stationId} />
            <InvoiceRow
              label="Operator Name"
              value={consumerDetails.operatorName || '-'}
            />
            <InvoiceRow label="Meter No." value={consumerDetails.meterNo} />
            <InvoiceRow
              label="₹ Tariff"
              value={`₹${consumerDetails.tariff}`}
            />
            <InvoiceRow
              label="Billing Period"
              value={formatBillingPeriod(consumerDetails.billingPeriod)}
            />
            <InvoiceRow
              label="Bill Number"
              value={consumerDetails.billNumber}
              isLast
            />
          </tbody>
        </table>
      </div>

      {/* Billing Summary */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={sectionHeading}>Billing Summary</h2>
        <table style={tableStyle}>
          <tbody>
            <InvoiceRow
              label="Start Reading"
              value={billingSummary.startReading.toLocaleString()}
            />
            <InvoiceRow
              label="End Reading"
              value={billingSummary.endReading.toLocaleString()}
            />
            <InvoiceRow
              label="Units Consumed"
              value={billingSummary.unitsConsumed.toLocaleString()}
            />
            <InvoiceRow
              label="Amount Payable"
              value={
                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                  ₹{billingSummary.amountPayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              }
              isLast
            />
          </tbody>
        </table>
      </div>

      {/* Payment Bank Details */}
      <div>
        <h2 style={sectionHeading}>Payment Bank Details</h2>
        <table style={tableStyle}>
          <tbody>
            <InvoiceRow label="Bank Name" value={bankDetails.bankName} />
            <InvoiceRow
              label="Bank Account Number"
              value={bankDetails.bankAccountNumber || '-'}
            />
            <InvoiceRow
              label="Bank Account Holder Name"
              value={bankDetails.bankAccountHolderName || '-'}
            />
            <InvoiceRow
              label="IFSC Code"
              value={bankDetails.ifscCode || '-'}
            />
            <InvoiceRow
              label="Operator Mobile Number"
              value={bankDetails.operatorMobileNumber || '-'}
              isLast
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
