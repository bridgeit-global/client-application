import { NavItem } from '@/types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const getNavItems = (site_name: string): NavItem[] => {
    return [
        {
            title: 'Dashboard',
            url: '/portal/dashboard',
            icon: 'dashboard',
            isCollapsible: false,
            shortcut: ['d', 'd'],
            items: []
        },
        {
            title: 'Infrastructure',
            url: '/portal/site',
            icon: 'site',
            isCollapsible: false,
            shortcut: ['s', 's'],
            items: [
                {
                    title: `${site_name}`,
                    url: '/portal/site/sites',
                    icon: 'site',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                    items: []
                },
                {
                    title: 'Postpaid',
                    url: '/portal/site/postpaid',
                    icon: 'billManage',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                    items: []
                },
                {
                    title: 'Prepaid',
                    url: '/portal/site/prepaid',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                    items: []
                },
                {
                    title: 'Submeter',
                    url: '/portal/site/submeter',
                    icon: 'site',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                    items: []
                }
            ]
        },

        {
            title: 'Bill',
            url: '/portal/bills',
            icon: 'billManage',
            isCollapsible: true,
            shortcut: ['b', 't'],
            items: [
                {
                    title: 'New',
                    url: '/portal/bills/new',
                    icon: 'billManage',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                },
                {
                    title: 'Approved',
                    url: '/portal/bills/approved',
                    icon: 'billManage',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                },
            ]

        },
        {
            title: 'Recharge',
            url: '/portal/recharges',
            icon: 'payment',
            isCollapsible: true,
            shortcut: ['r', 't'],
            items: [
                {
                    title: 'Low Balance',
                    url: '/portal/recharges/low-balance',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['r', 't'],
                },
                {
                    title: 'Approved',
                    url: '/portal/recharges/approved',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['r', 't'],
                },
            ]
        },
        {
            title: 'Batch',
            url: '/portal/batch',
            icon: 'batch',
            isCollapsible: true,
            shortcut: ['b', 'm'],
            items: [
                {
                    title: 'Batches',
                    url: '/portal/batch',
                    icon: 'batch',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                },
                {
                    title: 'Payments',
                    url: '/portal/batch-payment',
                    icon: 'batch',
                    isCollapsible: false,
                    shortcut: ['b', 't'],
                },
            ]
        },
        {
            title: 'Payment',
            url: '/portal/payment',
            icon: 'payment',
            isCollapsible: true,
            shortcut: ['p', 't'],
            items: [
                {
                    title: 'Bills Paid',
                    url: '/portal/payment/bill-paid',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['p', 't'],
                },
                {
                    title: 'Recharges Paid',
                    url: '/portal/payment/recharge-paid',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['p', 't'],
                },
                {
                    title: 'Statement',
                    url: '/portal/payment/statement',
                    icon: 'wallet',
                    isCollapsible: false,
                    shortcut: ['p', 't'],
                },
            ]
        },
        {
            title: 'Report',
            url: '/portal/report',
            icon: 'report',
            isCollapsible: false,
            shortcut: ['r', 'r'],
            items: [
                {
                    title: 'Registration',
                    url: '/portal/report/registration',
                    icon: 'registration',
                    isCollapsible: false,
                    shortcut: ['r', 'r'],
                },
                {
                    title: 'Bill',
                    url: '/portal/report/bill',
                    icon: 'pdfDownload',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'Payment',
                    url: '/portal/report/payment',
                    icon: 'payment',
                    isCollapsible: false,
                    shortcut: ['p', 'h'],
                },
                {
                    title: 'Recharge',
                    url: '/portal/report/recharge',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['r', 'h'],
                },
                {
                    title: 'Consumption',
                    url: '/portal/report/consumption',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['c', 'h'],
                },
                {
                    title: 'Bill Date',
                    url: '/portal/report/bill-date',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'Bill Type',
                    url: '/portal/report/bill-type',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'Sanction Load',
                    url: '/portal/report/sanction-load',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'LPSC',
                    url: '/portal/report/lpsc',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'Rebate',
                    url: '/portal/report/rebate',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },
                {
                    title: 'Timely Payment',
                    url: '/portal/report/payment-on-time',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },

                {
                    title: 'Bill Unit Cost',
                    url: '/portal/report/bill-unit-cost',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['b', 'h'],
                },

            ]
        },
        {
            title: 'Meter Reading',
            url: '/portal/meter-reading',
            icon: 'report',
            isCollapsible: false,
            shortcut: ['m', 'r'],
            items: []
        },
        {
            title: 'Meter Reading List',
            url: '/portal/meter-reading-list',
            icon: 'report',
            isCollapsible: false,
            shortcut: ['m', 'l'],
            items: []
        },
        {
            title: 'Report Issue',
            url: '/portal/report-issue',
            icon: 'warning',
            isCollapsible: false,
            shortcut: ['r', 'i'],
            items: []
        }

    ];
};



export const supportNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/support/dashboard',
        icon: 'dashboard',
        isCollapsible: false,
        shortcut: ['d', 'd'],
        items: []
    },
    {
        title: 'Registration',
        url: '/support/registration',
        icon: 'registration',
        isCollapsible: false,
        shortcut: ['r', 'r'],
        items: []
    },
    {
        title: 'Bill',
        url: '/support/bill',
        icon: 'billManage',
        isCollapsible: false,
        shortcut: ['b', 'e'],
        items: [
            {
                title: 'All',
                url: '/support/bill',
                icon: 'page',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
            {
                title: 'Lag',
                url: '/support/bill/lag',
                icon: 'warning',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
            {
                title: 'Not Fetch',
                url: '/support/bill/not-fetch',
                icon: 'warning',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
            {
                title: 'Upload',
                url: '/support/bill/upload',
                icon: 'add',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
            {
                title: 'Add',
                url: '/support/bill/add',
                icon: 'add',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
            {
                title: 'Failure',
                url: '/support/bill/failure',
                icon: 'warning',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            }
        ]
    },
    {
        title: 'Recharge',
        url: '/support/recharge',
        icon: 'wallet',
        isCollapsible: false,
        shortcut: ['b', 'b'],
        items: [
            {
                title: 'Balance Lag',
                url: '/support/recharge/balance-lag',
                icon: 'warning',
                isCollapsible: false,
                shortcut: ['b', 't'],
                items: []
            },
        ]
    },
    {
        title: 'Payment',
        url: '',
        icon: 'payment',
        isCollapsible: false,
        shortcut: ['p', 'e'],
        items: [
            {
                title: 'Payment Transaction',
                url: '/support/payment/payment-transaction',
                icon: 'payment',
                isCollapsible: false,
                shortcut: ['p', 'e'],
            },
            {
                title: 'Bill & Recharge Payment',
                url: '/support/payment/bill-payment',
                icon: 'payment',
                isCollapsible: false,
                shortcut: ['p', 'e'],
            },
            {
                title: 'Bill Payment Update',
                url: '/support/payment/bill-payment-update',
                icon: 'payment',
                isCollapsible: false,
                shortcut: ['p', 'e'],
            },
            {
                title: 'Recharge Payment Update',
                url: '/support/payment/recharge-payment-update',
                icon: 'payment',
                isCollapsible: false,
                shortcut: ['p', 'e'],
            },
            {
                title: 'Refund Transaction',
                url: '/support/payment/refund-transaction',
                icon: 'payment',
                isCollapsible: false,
                shortcut: ['p', 'e'],
            },
            {
                title: 'Statement',
                url: '/support/payment/statement',
                icon: 'wallet',
                isCollapsible: false,
                shortcut: ['d', 'd'],
                items: []
            }
        ]
    },
    {
        title: 'Blog',
        url: '/support/blog',
        icon: 'blog',
        isCollapsible: false,
        shortcut: ['b', 'b'],
        items: []
    },
    {
        title: 'Meter Reading',
        url: '/support/meter-reading',
        icon: 'report',
        isCollapsible: false,
        shortcut: ['m', 'r'],
        items: []
    }
];



