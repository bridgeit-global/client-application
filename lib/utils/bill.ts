import { AllBillTableProps, BillsProps } from "@/types/bills-type";
import { PrepaidRechargeTableProps } from "@/types/connections-type";
import { PaidBillTableProps, PaymentsProps, PaymentTableProps } from "@/types/payments-type";
import { formatNumber, formatRupees } from "./number-format";

export const getNewBillCount = (bills: AllBillTableProps[], payType: "postpaid" | "prepaid" | "submeter"): number => {
    if (payType === "postpaid" || payType === "submeter") {
        return bills.filter(
            (b) => b.payment_status == false && b.is_active === false
        ).length;
    }
    return 0;
};

export const getOverdueCount = (bills: AllBillTableProps[], payType: "postpaid" | "prepaid"): number => {
    if (payType === "postpaid") {
        return bills.filter(
            (b) => b.payment_status == false && (new Date(b.due_date) < new Date())
        ).length;
    }
    return 0;
};


export const getLatestBill = (bills: AllBillTableProps[] | BillsProps[]): AllBillTableProps | BillsProps | null => {
    if (!bills || !Array.isArray(bills) || bills.length === 0) return null;
    const activeBills = bills.filter((b) => b.is_active == true && b.is_valid == true);
    return activeBills.length > 0 ? activeBills[0] : null;
};


export const getLatestRecharge = (recharges: PrepaidRechargeTableProps[]): PrepaidRechargeTableProps | null => {
    if (!recharges || !Array.isArray(recharges) || recharges.length === 0) return null;
    const activeRecharges = recharges.filter((r) => r.is_active == true && r.is_deleted == false);
    if (activeRecharges.length === 0) return null;
    return activeRecharges.sort((a, b) =>
        new Date(b.recharge_date).getTime() - new Date(a.recharge_date).getTime()
    )[0];
};


export const getTodaysAmount = (bill: AllBillTableProps): number => {
    if (!bill) return 0;

    const currentDate = new Date(new Date().toISOString().split('T')[0]);
    let finalAmount = bill.bill_amount;

    const discountDate = bill.discount_date ? new Date(bill.discount_date) : null;
    const dueDate = bill.due_date ? new Date(bill.due_date) : null;
    const dueDateRebate = bill.due_date_rebate || 0;
    const discountDateRebate = bill.discount_date_rebate || 0;

    if (dueDate && currentDate > dueDate && bill.penalty_amount) {
        finalAmount += bill.penalty_amount;
    }

    if (dueDate && currentDate <= dueDate) {
        finalAmount -= dueDateRebate;
    }

    if (discountDate && currentDate <= discountDate) {
        finalAmount -= discountDateRebate;
    }

    return finalAmount;
};

/**
 * Checks if the total approved amount (existing + new batch) exceeds the allowed threshold.
 * @param totalAmount - The total amount for the new batch
 * @param totalApproved - The current total approved amount
 * @param threshold - The maximum allowed threshold
 * @returns {boolean} - Returns true if within threshold, false otherwise
 */
export function isWithinBatchThreshold(totalAmount: number, totalApproved: number, threshold: number): boolean {
    return (totalApproved + totalAmount) <= threshold;
}
