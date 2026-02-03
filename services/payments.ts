import { PAY_TYPE_LIST } from '@/constants/bill';
import { ddmmyy, getDueDate } from '@/lib/utils/date-format';
import { createClient } from '@/lib/supabase/server';
import { getPayment, processValues } from '@/lib/utils';
import { convertKeysToTitleCase } from '@/lib/utils/string-format';
import { SearchParamsProps } from '@/types';
import { AllBillTableProps } from '@/types/bills-type';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { SupabaseError } from '@/types/supabase-type';
import { cache } from 'react';
import { ClientPaymentsProps, PaymentGatewayTransactionsProps, RefundPaymentTransactionsProps, WalletProps, WalletSummaryProps } from '@/types/payments-type';
import { BatchTableProps } from '@/types/batches-type';
import { fetchOrganization } from './organization';

type Result<TData> = {
  data: TData[];
  export_data?: SearchParamsProps[];
  allBills?: ClientPaymentsProps[];
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
  summary?: WalletSummaryProps;
};


export const fetchPrepaidPaid = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<PrepaidRechargeTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      recharge_date_start,
      recharge_date_end,
      account_number,
      site_id,
      biller_id,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('prepaid_recharge')
      .select(
        '*, connections!inner(id,paytype,biller_list!inner(*),site_id,biller_id,account_number,is_active,sites!inner(*))',
        {
          count: 'estimated'
        }
      )
      .match({
        recharge_status: 'paid'
      })
      .eq('connections.is_active', true)

    if (biller_id) {
      const value = processValues(biller_id);
      query = query.in('connections.biller_list.alias', value);
    }

    if (site_id) {
      const value = processValues(site_id);
      query = query.in('connections.site_id', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('connections.account_number', value);
    }

    if (type) {
      const value = processValues(type);
      query = query.in('connections.sites.type', value);
    }

    if (recharge_date_start && recharge_date_end) {
      query = query
        .gte('recharge_date', recharge_date_start)
        .lte('recharge_date', recharge_date_end);
    }

    if (options?.is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site?.connections?.sites?.type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          recharge_amount: site.recharge_amount,
          recharge_date: ddmmyy(site.recharge_date),
        };
      });

      return {
        data: [],
        export_data: convertKeysToTitleCase(modifiedData),
        totalCount: 0,
        pageCount: 0
      };
    }

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount
    };
  }
);


export const fetchPostpaidPaid = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<AllBillTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      due_date_start,
      due_date_end,
      account_number,
      site_id,
      biller_id,
      type,
      sort,
      bill_date_start,
      bill_date_end,
      order = 'asc'
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('bills')
      .select(
        '*, meter_readings(meter_no,end_date,end_reading,start_date,start_reading,type,multiplication_factor),connections!inner(*,biller_list!inner(*),payments(*))',
        {
          count: 'estimated'
        }
      )
      .match({
        payment_status: true,
        is_active: true,
        is_valid: true,
        is_deleted: false
      })
      .not('connections.paytype', 'eq', 0)
      .eq('connections.is_active', true)

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('due_date', { ascending: true });
    }

    if (type) {
      const value = processValues(type);
      query = query.in('site_type', value);
    }

    if (biller_id) {
      const value = processValues(biller_id);
      query = query.in('connections.biller_list.alias', value);
    }

    if (site_id) {
      const value = processValues(site_id);
      query = query.in('connections.site_id', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('connections.account_number', value);
    }

    if (bill_date_start && bill_date_end) {
      query = query
        .gte('bill_date', bill_date_start)
        .lte('bill_date', bill_date_end);
    }

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (due_date_start && due_date_end) {
      query = query
        .gte('due_date', due_date_start)
        .lte('due_date', due_date_end);
    }

    if (options?.is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        const { collection_date, reference_id, amount } = getPayment(
          site.connections.payments
        );
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site.site_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: PAY_TYPE_LIST.find((b) => b.value == site.connections.paytype)
            ?.name,
          amount: amount,
          start_date: ddmmyy(site.start_date),
          end_date: ddmmyy(site.end_date),
          billed_unit: site.billed_unit,
          // meter_reading: JSON.stringify(site.meter_readings),
          transaction_date: collection_date && ddmmyy(collection_date),
          transaction_id: reference_id
        };
      });

      return {
        data: [],
        export_data: convertKeysToTitleCase(modifiedData),
        totalCount: 0,
        pageCount: 0
      };
    }

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount
    };
  }
);


export const fetchPaymentEdit = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean }
): Promise<Result<AllBillTableProps>> => {
  const {
    page = 1,
    limit = 10,
    account_number,
    site_id,
    biller_id,
    type
  } = searchParams;

  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;

  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up

  let query = supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))', {
      count: 'estimated'
    })
    .match({
      is_valid: true,
      is_deleted: false
    })
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false);

  query = query
  .order('bill_date', { ascending: false })
    .order('payment_status', { ascending: true });

  if (biller_id) {
    const value = processValues(biller_id);
    query = query.in('connections.biller_list.alias', value);
  }

  if (site_id) {
    const value = processValues(site_id);
    query = query.in('connections.site_id', value);
  }

  if (account_number) {
    const value = processValues(account_number);
    query = query.in('connections.account_number', value);
  }

  if (type) {
    const value = processValues(type);
    query = query.in('site_type', value);
  }

  if (options?.is_export) {
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const { site_name } = await fetchOrganization();

    const modifiedData = data.map((site) => {
      return {
        id: site.id,
        [`${site_name}_id`]: site.connections.site_id,
        [`${site_name}_type`]: site.site_type,
        account_number: String(site.connections.account_number),
        biller_board: site.connections.biller_list.board_name,
        state: site.connections.biller_list.state,
        bill_date: ddmmyy(site.bill_date),
        due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
        bill_amount: site.bill_amount
      };
    });

    return {
      data: [],
      export_data: convertKeysToTitleCase(modifiedData),
      totalCount: 0,
      pageCount: 0
    };
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;

  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);

  return {
    data: data || [],
    totalCount,
    pageCount
  };
};

export const fetchRechargePaymentEdit = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean }
): Promise<Result<PrepaidRechargeTableProps>> => {
  const {
    page = 1,
    limit = 10,
    account_number,
    site_id,
    biller_id,
    type
  } = searchParams;

  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;
  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up
  let query = supabase
    .from('prepaid_recharge')
    .select('*,connections!inner(*,biller_list!inner(*),sites!inner(*))', {
      count: 'estimated'
    })
    .eq('is_active', true)
    .in('recharge_status', ['batch', 'payment'])
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false);

  query = query.order('recharge_date', { ascending: true });

  if (biller_id) {
    const value = processValues(biller_id);
    query = query.in('connections.biller_list.alias', value);
  }

  if (site_id) {
    const value = processValues(site_id);
    query = query.in('connections.site_id', value);
  }

  if (account_number) {
    const value = processValues(account_number);
    query = query.in('connections.account_number', value);
  }

  if (type) {
    const value = processValues(type);
    query = query.in('connections.sites.type', value);
  }

  if (options?.is_export) {
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const { site_name } = await fetchOrganization();

    const modifiedData = data.map((site) => {
      return {
        id: site.id,
        [`${site_name}_id`]: site.connections.site_id,
        [`${site_name}_type`]: site.connections.sites.type,
        account_number: String(site.connections.account_number),
        biller_board: site.connections.biller_list.board_name,
        state: site.connections.biller_list.state,
        recharge_amount: site.recharge_amount,
        recharge_date: ddmmyy(site.recharge_date),
      };
    });

    return {
      data: [],
      export_data: convertKeysToTitleCase(modifiedData),
      totalCount: 0,
      pageCount: 0
    };
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;
  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);

  return {
    data: data || [],
    totalCount,
    pageCount
  };
};

export const fetchBillPayments = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean, batch_id?: string }
): Promise<Result<ClientPaymentsProps>> => {
  const {
    page = 1,
    limit = 10,
    account_number,
    site_id,
    biller_id,
    batch_id,
    type,
    status
  } = searchParams;
  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;

  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up

  let query = supabase
    .from('client_payments')
    .select(`*,
      batches(*),
      bills(*,connections!inner(*,biller_list!inner(*)),biller_payment_transactions(*),refund_payment_transactions(*)),
      prepaid_recharge(*,connections!inner(*,sites!inner(*),biller_list!inner(*)),biller_payment_transactions(*),refund_payment_transactions(*))
    `, {
      count: 'estimated'
    })

  query = query.order('status', { ascending: false });

  let allBills = [];

  if (options?.batch_id) {
    query = query.eq('batch_id', options?.batch_id);
    const { data, error } = await query;
    if (error) {
      console.error('error', error);
    }
    allBills = data || [];
  }

  if (batch_id) {
    query = query.eq('batch_id', batch_id);
  }


  if (biller_id) {
    const value = processValues(biller_id);
    query = query.in('bills.connections.biller_list.alias', value);
    query = query.in('prepaid_recharge.connections.biller_list.alias', value);
  }

  if (site_id) {
    const value = processValues(site_id);
    query = query.in('bills.connections.site_id', value);
    query = query.in('prepaid_recharge.connections.site_id', value);
  }

  if (account_number) {
    const value = processValues(account_number);
    query = query.in('bills.connections.account_number', value);
    query = query.in('prepaid_recharge.connections.account_number', value);
  }

  if (type) {
    const value = processValues(type);
    query = query.in('bills.site_type', value);
    query = query.in('prepaid_recharge.connections.sites.type', value);
  }

  if (status) {
    query = query.eq('status', status);
  }


  if (options?.is_export) {
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const { site_name } = await fetchOrganization();

    const modifiedData = data.map((site) => {
      return {
        id: site.id,
        [`${site_name}_id`]: site.bills.connections.site_id,
        [`${site_name}_type`]: site.bills.site_type,
        account_number: String(site.bills.connections.account_number),
        biller_board: site.bills.connections.biller_list.board_name,
        state: site.bills.connections.biller_list.state,
        bill_date: ddmmyy(site.bills.bill_date),
        due_date: ddmmyy(getDueDate(site.bills.discount_date, site.bills.due_date)),
        bill_amount: site.bills.bill_amount,
        recharge_amount: site?.prepaid_recharge?.recharge_amount,
        recharge_date: ddmmyy(site?.prepaid_recharge?.recharge_date),
      };
    });

    return {
      data: [],
      export_data: convertKeysToTitleCase(modifiedData),
      totalCount: 0,
      pageCount: 0
    };
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;

  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);
  return {
    allBills: allBills,
    data: data || [],
    totalCount,
    pageCount
  };
};


export const fetchClientWallet = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean, side?: 'portal' | 'support' }
): Promise<Result<WalletProps>> => {
  const {
    page = 1,
    limit = 10,
    batch_id,
    transaction_type,
    transaction_id,
    amount_min,
    amount_max,
    date_from,
    date_to,
    remarks,
    sort,
    order
  } = searchParams;
  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;

  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up


  // Fetch wallet summary using the custom Postgres function
  const { data: summaryData, error: summaryError } = await supabase
    .rpc('get_wallet_balances'); // Pass org_id if needed

  if (summaryError) {
    return {
      data: [],
      totalCount: 0,
      pageCount: 0,
      error: summaryError
    };
  }

  const summary = summaryData && summaryData.length > 0
    ? {
      count: Number(summaryData[0].count),
      credits: Number(summaryData[0].credits),
      debits: Number(summaryData[0].debits),
      balance: Number(summaryData[0].balance),
    }
    : {
      count: 0,
      credits: 0,
      debits: 0,
      balance: 0,
    };

  let query = supabase
    .from('client_wallet_ledgers')
    .select('*,bills(*,connections!inner(*,biller_list!inner(*))),prepaid_recharge(*,connections!inner(*,biller_list!inner(*)))', {
      count: 'estimated'
    }).not('transaction_id', 'is', null)

  // Apply filters
  if (batch_id) {
    query = query.eq('batch_id', batch_id);
  }

  if (transaction_type) {
    query = query.eq('transaction_type', transaction_type);
  }

  if (transaction_id) {
    query = query.ilike('transaction_id', `%${transaction_id}%`);
  }

  if (amount_min) {
    query = query.gte('amount', Number(amount_min));
  }

  if (amount_max) {
    query = query.lte('amount', Number(amount_max));
  }

  if (date_from && date_to) {
    query = query
      .gte('created_at', date_from)
      .lte('created_at', date_to);
  }

  if (remarks) {
    query = query.ilike('remarks', `%${remarks}%`);
  }

  // Apply sorting if provided
  if (sort && order) {
    query = query.order(sort, { ascending: order === 'asc' });
  } else {
    // Default sorting by created_at desc
    query = query.order('updated_at', { ascending: false });
  }

  if (options?.is_export) {
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }

    const modifiedData = data.map((site) => {
      const transaction_type = options?.side === 'portal' ? (site.transaction_type === 'credit' ? 'Paid' : 'Biller Payment') : site.transaction_type
      return {
        id: site.id,
        batch_id: site.batch_id,
        account_number: site?.bills?.connections?.account_number || site?.prepaid_recharge?.connections?.account_number,
        biller_board: site?.bills?.connections?.biller_list?.board_name || site?.prepaid_recharge?.connections?.biller_list?.board_name,
        transaction_id: site.transaction_id,
        transaction_type: transaction_type,
        amount: site.amount,
        remarks: site.remarks,
        created_at: site.created_at,
        updated_at: site.updated_at,
      };
    });

    return {
      data: [],
      export_data: convertKeysToTitleCase(modifiedData),
      totalCount: 0,
      pageCount: 0
    };
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;

  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);

  return {
    data: data || [],
    totalCount,
    pageCount,
    summary
  };
};

export const fetchPaymentGatewayTransactions = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean, status: 'pending' | 'others' }
): Promise<Result<PaymentGatewayTransactionsProps>> => {
  const {
    page = 1,
    limit = 10,
    batch_id,
    transaction_reference,
    transaction_date_start,
    transaction_date_end,
    payment_method,
    payment_status,
    created_at_start,
    created_at_end,
  } = searchParams;
  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;

  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up

  let query = supabase
    .from('payment_gateway_transactions')
    .select('*', {
      count: 'estimated'
    })

  query = query.order('created_at', { ascending: false });

  if (options?.status === 'pending') {
    query = query.eq('payment_status', 'pending');
  } else if (options?.status === 'others') {
    query = query.neq('payment_status', 'pending');
  }
  // Apply filters
  if (batch_id) {
    query = query.eq('batch_id', batch_id);
  }
  if (transaction_reference) {
    query = query.ilike('transaction_reference', `%${transaction_reference}%`);
  }
  if (transaction_date_start && transaction_date_end) {
    query = query
      .gte('transaction_date', transaction_date_start)
      .lte('transaction_date', transaction_date_end);
  }
  if (payment_method) {
    query = query.eq('payment_method', payment_method);
  }
  if (payment_status) {
    query = query.ilike('payment_status', `%${payment_status}%`);
  }
  if (created_at_start && created_at_end) {
    query = query
      .gte('created_at', created_at_start)
      .lte('created_at', created_at_end);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.is_export) {
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }

    const modifiedData = data.map((site) => {
      return {
        id: site.id,
        batch_id: site.batch_id,
        transaction_reference: site.transaction_reference,
        amount: site.amount,
        transaction_date: ddmmyy(site.transaction_date),
        payment_method: site.payment_method,
        payment_status: site.payment_status,
        payment_remarks: site.payment_remarks,
        created_at: site.created_at,
      };
    });

    return {
      data: [],
      export_data: convertKeysToTitleCase(modifiedData),
      totalCount: 0,
      pageCount: 0
    };
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;

  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);

  return {
    data: data || [],
    totalCount,
    pageCount
  };
};

export const fetchBatchPayment = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<BatchTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      batch_id,
      sort,
      order = 'asc'
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('batches')
      .select(
        `*,
        client_payments(*,bills(approved_amount),prepaid_recharge(recharge_amount)),
        payment_gateway_transactions(*),
        refund_payment_transactions(*)`,
        {
          count: 'estimated'
        }
      )
      .not('batch_status', 'eq', 'unpaid')

    // Apply sorting if sort parameter is provided
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      // Keep the default sorting by due_date if no sort parameter
      query = query.order('created_at', { ascending: false });
    }

    if (batch_id) {
      const value = processValues(batch_id);
      query = query.in('batch_id', value);
    }

    if (options?.is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site.site_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: PAY_TYPE_LIST.find((b) => b.value == site.connections.paytype)
            ?.name,
          due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
          bill_amount: site.bill_amount
        };
      });

      return {
        data: [],
        export_data: convertKeysToTitleCase(modifiedData),
        totalCount: 0,
        pageCount: 0
      };
    }

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount
    };
  }
);

export const fetchRefundPaymentTransactions = async (
  searchParams: SearchParamsProps,
  options?: { is_export?: boolean }
): Promise<Result<RefundPaymentTransactionsProps>> => {
  const {
    page = 1,
    limit = 10,
    batch_id,
    transaction_id,
    amount_min,
    amount_max,
    date_from,
    date_to,
    remarks,
    sort,
    order
  } = searchParams;
  const pageLimit = Number(limit);
  const offset = (Number(page) - 1) * pageLimit;

  // Initialize the Supabase client
  const supabase = await createClient();

  let query = supabase
    .from('refund_payment_transactions')
    .select('*', {
      count: 'estimated'
    });

  // Apply filters
  if (batch_id) {
    query = query.eq('batch_id', batch_id);
  }

  if (transaction_id) {
    query = query.ilike('transaction_id', `%${transaction_id}%`);
  }

  if (amount_min) {
    query = query.gte('amount', Number(amount_min));
  }

  if (amount_max) {
    query = query.lte('amount', Number(amount_max));
  }

  if (date_from && date_to) {
    query = query
      .gte('created_at', date_from)
      .lte('created_at', date_to);
  }

  if (remarks) {
    query = query.ilike('remarks', `%${remarks}%`);
  }

  // Apply sorting if provided
  if (sort && order) {
    query = query.order(sort, { ascending: order === 'asc' });
  } else {
    // Default sorting by created_at desc
    query = query.order('status', { ascending: false });
  }

  // Apply pagination range
  query = query.range(offset, offset + pageLimit - 1);

  // Execute the query and return the data
  const { data, count, error } = await query;

  if (error) {
    console.error('error', error);
  }
  const totalCount = count || 0;
  const pageCount = Math.ceil(totalCount / pageLimit);

  return {
    data: data || [],
    totalCount,
    pageCount
  };
};




