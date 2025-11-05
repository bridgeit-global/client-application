'use client';
import { PAY_TYPE } from '@/constants/bill';
import { snakeToTitle } from '@/lib/utils/string-format';
const PayTypeBadge = ({ paytype }: { paytype: number | null }) => {
    if (paytype !== null) {
        return snakeToTitle(PAY_TYPE[paytype])
    }
}

export default PayTypeBadge;
