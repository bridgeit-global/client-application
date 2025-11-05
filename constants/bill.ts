export const PAY_TYPE: any = {
    '0': 'prepaid',
    '1': 'postpaid',
    '-1': 'submeter'
};

export const PAY_TYPE_LIST: { name: string; value: string }[] = [
    {
        name: 'Postpaid',
        value: '1'
    },
    {
        name: 'Prepaid',
        value: '0'
    },
    {
        name: 'Submeter',
        value: '-1'
    }
];

export const BILL_STATUS: any = {
    'new': 'New',
    'approved': 'Approved',
    'batch': 'In-Batch',
    'payment': 'Payment',
    'paid': 'Paid',
    'rejected': 'Rejected'
};

export const BILL_STATUS_LIST: { name: string; value: string }[] = [
    {
        name: 'New',
        value: 'new'
    },
    {
        name: 'Approved',
        value: 'approved'
    },
    {
        name: 'In Batch',
        value: 'batch'
    },
    {
        name: 'Payment',
        value: 'payment'
    },
    {
        name: 'Paid',
        value: 'paid'
    },
    {
        name: 'Rejected',
        value: 'rejected'
    }
];  
