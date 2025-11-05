import { ChartData } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { PaymentsProps } from '@/types/payments-type';
import { PrepaidBalanceProps } from '@/types/prepaid-balance-type';
import { AllBillTableProps, BillsProps } from '@/types/bills-type';
import { formatRupees } from './utils/number-format';
import { ClientPaymentsProps } from '@/types/payments-type';

export const exportToExcel = async ({ json, fileName }: any): Promise<void> => {
  // Convert data to worksheet
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
  // Create a new workbook and append the worksheet
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Export the workbook to an Excel file
  XLSX.writeFile(workbook, fileName + '.xlsx');
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
};

export const getChartData = (
  data: any[] | null,
  dataKey: string
): ChartData[] => {
  const groupedData: Record<string, ChartData> = {};
  let earliestDate = Infinity;
  let latestDate = -Infinity;

  data?.forEach((item: any) => {
    // Check if the dataKey exists in the item
    if (!item.hasOwnProperty(dataKey)) {
      return; // Skip if the dataKey is missing
    }

    const rawAmount = item.bill_amount;
    const amount = parseFloat(rawAmount); // Convert to a valid number
    if (isNaN(amount)) return; // Skip invalid bill_amount values

    if (!item[dataKey]) {
      return; // Skip invalid date values
    }

    const date = new Date(item[dataKey]);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return; // Skip invalid date values
    }

    // Normalize the date to midnight (00:00:00)
    date.setHours(0, 0, 0, 0);
    const timestamp = date.getTime();

    // Track the earliest and latest dates
    if (timestamp < earliestDate) earliestDate = timestamp;
    if (timestamp > latestDate) latestDate = timestamp;

    if (!groupedData[timestamp]) {
      groupedData[timestamp] = {
        [dataKey]: timestamp,
        batchCreatedAmount: 0,
        nonBatchCreatedAmount: 0,
        paymentAmount: 0,
        totalAmount: 0, // Initialize totalAmount
        count: 0
      };
    }

    if (item.payment_status) {
      groupedData[timestamp].paymentAmount += amount;
    } else if (item.batch_id) {
      groupedData[timestamp].batchCreatedAmount += amount;
    } else {
      groupedData[timestamp].nonBatchCreatedAmount += amount;
    }

    // Add to totalAmount regardless of batchId
    groupedData[timestamp].totalAmount += amount;
    groupedData[timestamp].count += 1;
  });

  // Ensure the full range of dates is covered, filling gaps if necessary
  for (
    let time = earliestDate;
    time <= latestDate;
    time += 24 * 60 * 60 * 1000 // Increment by 1 day
  ) {
    if (!groupedData[time]) {
      groupedData[time] = {
        [dataKey]: time,
        batchCreatedAmount: 0,
        nonBatchCreatedAmount: 0,
        paymentAmount: 0,
        totalAmount: 0, // Ensure totalAmount is initialized for gaps
        count: 0
      };
    }
  }

  return Object.values(groupedData).sort(
    (a, b) => (a[dataKey] as number) - (b[dataKey] as number)
  );
};

interface AccountData {
  next_bill_date: string;
  aging?: number;
}

export const calculateAging = (
  data: any
): {
  accounts: AccountData[];
  agingGroupCounts: { age: string; count: number }[];
} => {
  const today = new Date();

  const agingGroupCounts: Record<string, number> = {
    'Over 10 days': 0,
    '6-10 days': 0,
    '0-5 days': 0
  };

  const accounts = data.map((item: AccountData) => {
    const billDate = new Date(item.next_bill_date);
    const timeDifference = today.getTime() - billDate.getTime();
    const agingInDays = Math.floor(timeDifference / (1000 * 3600 * 24));

    // Determine aging group
    let agingGroup: string;

    if (agingInDays >= 0 && agingInDays <= 5) {
      agingGroup = '0-5 days';
    } else if (agingInDays >= 6 && agingInDays <= 10) {
      agingGroup = '6-10 days';
    } else {
      agingGroup = 'Over 10 days';
    }
    // Increment the count for the corresponding aging group
    agingGroupCounts[agingGroup]++;

    return {
      ...item,
      aging: agingInDays,
      agingGroup: agingGroup
    };
  });

  // Transform agingGroupCounts into the desired array format
  const agingGroupArray = Object.entries(agingGroupCounts).map(
    ([age, count]) => ({ age, count })
  );

  return {
    accounts,
    agingGroupCounts: agingGroupArray
  };
};

export const getLastWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Get current day (0 is Sunday, 6 is Saturday)
  const lastSunday = new Date(today.setDate(today.getDate() - dayOfWeek - 7)); // Last week's Sunday
  lastSunday.setHours(0, 0, 0, 0); // Set time to start of the day
  return lastSunday;
};

export const getNextWeekEnd = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const nextSaturday = new Date(
    today.setDate(today.getDate() + (6 - dayOfWeek) + 7)
  ); // Next week's Saturday
  nextSaturday.setHours(23, 59, 59, 999); // Set time to end of the day
  return nextSaturday;
};

export const getPayment = (payments: PaymentsProps[]) => {
  if (Array.isArray(payments) && payments.length > 0) {
    return payments.reduce((latest, payment) => {
      return new Date(payment.collection_date) >
        new Date(latest.collection_date)
        ? payment
        : latest;
    });
  } else {
    return {
      amount: null,
      collection_date: null,
      reference_id: null,
      content_type: null,
      content: null
    };
  }
};

export const getPrepaidBalance = (prepaid_balances: PrepaidBalanceProps[]): PrepaidBalanceProps => {
  if (Array.isArray(prepaid_balances) && prepaid_balances.length > 0) {
    return prepaid_balances.reduce((latest, prepaid) => {
      return new Date(prepaid.fetch_date) > new Date(latest.fetch_date)
        ? prepaid
        : latest;
    });
  } else {
    return {
      fetch_date: '',
      balance_amount: 0
    } as PrepaidBalanceProps;
  }
};

interface PrepaidBalance {
  fetch_date: string; // ISO format date string
  balance_amount: number;
}

const isLatestThreeAmountsSame = (
  prepaidBalanceList: PrepaidBalance[]
): boolean => {
  if (prepaidBalanceList.length < 3) {
    return false; // Less than 3 records, so return false
  }
  // Sort the list by `fetch_date` in descending order (latest first)
  const sortedList = prepaidBalanceList.sort(
    (a, b) =>
      new Date(b.fetch_date).getTime() - new Date(a.fetch_date).getTime()
  );

  // Get the latest three records
  const latestThree = sortedList.slice(0, 3);

  // Check if all three amounts are the same
  const [first, second, third] = latestThree;
  return (
    first.balance_amount === second.balance_amount &&
    second.balance_amount === third.balance_amount
  );
};

export const prepaidBalanceLagStatus = (prepaid_balances: PrepaidBalanceProps[]) => {
  if (prepaid_balances.length) {
    const latestPrepaid = getPrepaidBalance(prepaid_balances);
    if (latestPrepaid.fetch_date == new Date().toISOString().split('T')[0]) {
      if (isLatestThreeAmountsSame(prepaid_balances)) {
        return {
          title: 'Latest three records have the same amount',
          color: 'yellow'
        };
      }
      return {
        title: 'Up-to-date',
        color: 'green'
      };
    } else {
      return {
        title: 'Not fetched today',
        color: 'orange'
      };
    }
  } else {
    return {
      title: 'No records available',
      color: 'red'
    };
  }
};

export const getLagAging = (site: any) => {
  // Calculate lag as before
  const billDate = site.next_bill_date
    ? new Date(site.next_bill_date)
    : new Date(site.created_at);
  const timeDifference = new Date().getTime() - billDate.getTime();
  const agingInDays = Math.floor(timeDifference / (1000 * 3600 * 24));
  return agingInDays;
};

// Function to generate the filled array
export function fillDatesWithDefaultAmount(
  data: PrepaidBalanceProps[]
): PrepaidBalanceProps[] {
  const filledArray: PrepaidBalanceProps[] = [];

  // Parse dates
  const sortedData = data.sort(
    (a, b) =>
      new Date(a.fetch_date).getTime() - new Date(b.fetch_date).getTime()
  );
  const startDate = new Date(sortedData[0].fetch_date);
  const endDate = new Date(sortedData[sortedData.length - 1].fetch_date);

  // Iterate through the date range
  for (
    let currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const existingData = data.find((item) => item.fetch_date === formattedDate);

    const filledObject: any = {
      fetch_date: formattedDate
    };
    if (existingData) {
      filledObject['balance_amount'] = existingData.balance_amount;
    }
    filledArray.push(filledObject);
  }
  return filledArray;
}

export const getAdjustedAmount = (bill: AllBillTableProps) => {

  if (bill.connections.paytype == 0) {
    return bill?.prepaid_recharge?.recharge_amount || bill.bill_amount
  }
  const currentDate = new Date();
  let adjustedAmount = bill.bill_amount || 0
  // Apply discount rebate if applicable
  if (bill.discount_date && new Date(bill.discount_date) > currentDate) {
    adjustedAmount -= bill.discount_date_rebate || 0;
  }

  if (bill.due_date && new Date(bill.due_date) > currentDate) {
    adjustedAmount -= bill.due_date_rebate || 0;
  }
  return adjustedAmount;
};

export const getAdjustedAmountForFailedBills = (bill: AllBillTableProps) => {

  if (bill.connections.paytype == 0) {
    return bill?.prepaid_recharge?.recharge_amount || bill.bill_amount
  }
  let adjustedAmount = bill.bill_amount || 0
  // Apply discount rebate if applicable
  if (bill.discount_date) {
    adjustedAmount -= bill.discount_date_rebate || 0;
  }
  if (bill.due_date) {
    adjustedAmount -= bill.due_date_rebate || 0;
  }

  return adjustedAmount;
};



export const getBeforeDueAmount = (bill: AllBillTableProps) => {
  let adjustedAmount = bill.bill_amount || 0
  // Apply discount rebate if applicable
  if (bill.discount_date) {
    adjustedAmount -= bill.discount_date_rebate || 0;
  }
  if (bill.due_date) {
    adjustedAmount -= bill.due_date_rebate || 0;
  }
  return adjustedAmount;
};

export const getAfterDueAmount = (bill: AllBillTableProps | BillsProps) => {
  let adjustedAmount = bill.bill_amount || 0
  // Apply penalty amount if applicable
  if (bill.penalty_amount) {
    adjustedAmount += bill.penalty_amount || 0;
  }
  return adjustedAmount;
}


export function calculatePayableAmount(billData: AllBillTableProps): {
  originalAmount: string;
  appliedRebate: string;
  rebateType: string;
  finalAmount: string;
} {
  const currentDate = new Date();
  const dueDate = new Date(billData.due_date);
  const discountDate = billData.discount_date
    ? new Date(billData.discount_date)
    : null;

  let appliedRebate = 0;
  let rebateType = 'No Rebate';

  if (discountDate && currentDate < discountDate) {
    appliedRebate = billData?.discount_date_rebate || 0;
    rebateType = 'Discount Date Rebate';
  }

  if (currentDate < dueDate) {
    appliedRebate = billData?.due_date_rebate || 0;
    rebateType = 'Due Date Rebate';
  }

  const finalAmount = billData.bill_amount - appliedRebate;

  return {
    originalAmount: formatRupees(billData.bill_amount),
    appliedRebate: formatRupees(appliedRebate),
    rebateType,
    finalAmount: formatRupees(finalAmount)
  };
}

export const processValues = (value: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || value.trim() === '') return []; // Handle empty or whitespace-only values
  // Split by both comma and white space using regex, trim spaces, and remove empty values
  const values = value
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter((value) => value !== '');
  return values;
};


type GroupedData = {
  paid: { count: number; totalAmount: number };
  unpaid: { count: number; totalAmount: number };
  total: { count: number; totalAmount: number };
};

export function groupBillsByPaymentStatus(bills: AllBillTableProps[]): GroupedData {
  const currentDate = new Date();

  return bills.reduce(
    (acc, bill) => {
      const statusKey = bill.payment_status ? 'paid' : 'unpaid';

      // Adjust the bill amount based on due date rebate and discount rebate
      let adjustedAmount = bill.approved_amount || 0
      // Update count and total amount for the specific status
      acc[statusKey].count += 1;
      acc[statusKey].totalAmount += adjustedAmount;

      // Update total count and total amount
      acc.total.count += 1;
      acc.total.totalAmount += adjustedAmount;

      return acc;
    },
    {
      paid: { count: 0, totalAmount: 0 },
      unpaid: { count: 0, totalAmount: 0 },
      total: { count: 0, totalAmount: 0 }
    }
  );
}

export const isDisabled = (row: AllBillTableProps) => {
  return !!row.batch_id || !!row.payment_status || !!row.receipt_url;
};

/**
 * Filters for 'increase amount' records in client payments.
 * A record is considered an 'increase amount' if:
 *   - status is 'new'
 *   - bill_amount and client_paid_amount are not null
 *   - bill_amount > client_paid_amount
 */
export function filterIncreaseAmountRecords(records?: ClientPaymentsProps[]): ClientPaymentsProps[] {
  if (!records) return [];
  return records.filter(
    (row) => {
      const clientPaidAmount = row.client_paid_amount || row?.bills?.approved_amount
      return row.status === 'unpaid' &&
        row.approval_status === 'pending' &&
        row.bill_amount &&
        clientPaidAmount &&
        row.bill_amount > clientPaidAmount
    }
  );
}






