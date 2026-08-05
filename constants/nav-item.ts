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
            items: []
        },

        {
            title: 'Operations',
            url: '/portal/operations',
            icon: 'billManage',
            isCollapsible: false,
            shortcut: ['o', 'p'],
            items: []
        },
        {
            title: 'Report',
            url: '/portal/report',
            icon: 'report',
            isCollapsible: false,
            shortcut: ['r', 'r'],
            items: [
                {
                    title: 'AI Analyst',
                    url: '/portal/report/ai',
                    icon: 'report',
                    isCollapsible: false,
                    shortcut: ['a', 'i'],
                },
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
    },
    {
        title: 'Submeter Bill',
        url: '/support/submeter-bill',
        icon: 'report',
        isCollapsible: false,
        shortcut: ['s', 'b'],
        items: []
    }
];



