import { Progress } from "@/components/ui/progress"
import { formatRupees } from '@/lib/utils/number-format';
import { Check, AlertCircle } from "lucide-react"

type BillPaymentStatusProps = {
    paidCount: number | string
    totalCount: number | string
    isAmount: boolean
}
export function BillPaymentStatus({ paidCount, totalCount, isAmount = false }: BillPaymentStatusProps) {
    const percentage = Math.round((Number(paidCount) / Number(totalCount)) * 100)
    const formattedPaidCount = isAmount ? formatRupees(paidCount) : paidCount
    const formattedTotalCount = isAmount ? formatRupees(totalCount) : totalCount

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                    {formattedPaidCount} / {formattedTotalCount}
                </span>
                <span className={`text-sm font-semibold ${percentage === 100 ? "text-green-600" : "text-amber-600"}`}>
                    {percentage}% {isAmount ? "Paid" : "Complete"}
                </span>
            </div>
            <Progress value={percentage} className="w-full" />
            <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Paid</span>
                </div>
                <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-600">Unpaid</span>
                </div>
            </div>
        </div>
    )
}

