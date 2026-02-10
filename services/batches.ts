import { ddmmyy, getDueDate } from '@/lib/utils/date-format';
import { createClient } from '@/lib/supabase/server';
import { getAdjustedAmountForFailedBills, getAfterDueAmount, getBeforeDueAmount, processValues } from '@/lib/utils';
import { convertKeysToTitleCase } from '@/lib/utils/string-format';
import { formatRupees } from '@/lib/utils/number-format';
import { SearchParamsProps } from '@/types';
import { BatchTableProps } from '@/types/batches-type';
import { AllBillTableProps } from '@/types/bills-type';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import { SupabaseError } from '@/types/supabase-type';
import { cache } from 'react';
import { PAY_TYPE } from '@/constants/bill';
import { fetchOrganization } from './organization';

type Result<TData> = {
  data: TData[];
  totalCount: number;
  pageCount: number;
  export_data?: SearchParamsProps[];
  error?: SupabaseError;
  allData?: TData[];
};

export const fetchBillsInBatches = cache(
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
      biller_id,
      account_number,
      type,
      sort,
      order,
      batch_id
    } = searchParams;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('bills')
      .select(
        '*,batches!inner(*),connections!inner(*,paytype,biller_list!inner(*),bills!inner(bill_amount,is_valid,is_active,approved_amount))',
        {
          count: 'estimated'
        }
      )
      .match({
        is_valid: true,
        bill_status: 'batch',
        is_deleted: false
      })

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('due_date', { ascending: true });
    }

    let allData: AllBillTableProps[] = [];

    if (batch_id) {
      query = query.eq('batch_id', batch_id);
      const { data } = await query;
      allData = data || [];
    }

    if (biller_id) {
      const value = processValues(biller_id);
      query = query.in('connections.biller_list.alias', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('connections.account_number', value);
    }

    if (type) {
      const value = processValues(type);
      query = query.in('site_type', value);
    }

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
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
          pay_type: PAY_TYPE[site.connections.paytype as keyof typeof PAY_TYPE],
          bill_number: site.bill_number,
          due_date: ddmmyy(getDueDate(site?.discount_date, site.due_date)),
          bill_date: ddmmyy(site.bill_date),
          bill_amount: formatRupees(site.bill_amount),
          before_due_Amount: formatRupees(getBeforeDueAmount(site)),
          after_due_Amount: formatRupees(getAfterDueAmount(site)),
          approved_amount: formatRupees(site.approved_amount),
          start_date: site.start_date,
          end_date: site.end_date,
          billed_unit: site.billed_unit,
          unit_cost: site.unit_cost,
          swap_cost: site.swap_cost,
          payment_status: !site.is_active && !site.payment_status ? 'Carried Forward' : site.payment_status ? 'Paid' : 'Unpaid',
        }
      })

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
      allData: allData || [],
      totalCount,
      pageCount
    };
  }
);

export const fetchRechargesInBatches = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<PrepaidRechargeTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      biller_id,
      account_number,
      type,
      recharge_date_start,
      recharge_date_end,
      batch_id
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('prepaid_recharge')
      .select(
        '*,connections!inner(*,sites!inner(*),paytype,biller_list!inner(*)),batches!inner(*)',
        {
          count: 'estimated'
        }
      )
      .match({
        recharge_status: 'batch'
      })

    let allData: PrepaidRechargeTableProps[] = [];
    if (batch_id) {
      query = query.eq('batch_id', batch_id);
      const { data } = await query;
      allData = data || [];
    }
    if (biller_id) {
      const value = processValues(biller_id);
      query = query.in('connections.biller_list.alias', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('connections.account_number', value);
    }

    if (type) {
      const value = type.split(',');
      query = query.in('site_type', value);
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
          [`${site_name}_type`]: site.connections.sites.type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: PAY_TYPE[site.connections.paytype as keyof typeof PAY_TYPE],
          recharge_date: ddmmyy(site.recharge_date),
          recharge_amount: formatRupees(site?.recharge_amount),
        }
      })

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
        allData: allData || [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      allData: allData || [],
      totalCount,
      pageCount
    };
  }
);

export const fetchAllBatches = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<BatchTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      batch_id,
      order,
      sort
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('batches')
      .select(
        `*,
        bills(*,connections!inner(paytype,biller_list!inner(*))),
        prepaid_recharge(*,connections!inner(paytype,biller_list!inner(*))),
        created_by_user:users!batches_created_by_fkey(*),
        updated_by_user:users!batches_updated_by_fkey(*)
        `,
        {
          count: 'estimated'
        }
      )
      .in('batch_status ', ['unpaid', 'processing']).or('bills.not.is.null,prepaid_recharge.not.is.null');
    // Apply sorting if sort parameter is provided
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      // Keep the default sorting by created_at if no sort parameter
      query = query.order('created_at', { ascending: false });
    }

    if (batch_id) {
      const value = processValues(batch_id);
      query = query.in('batch_id', value);
    }

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
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

      const modifiedData = convertKeysToTitleCase(data);
      return {
        data: [],
        export_data: modifiedData,
        totalCount: 0,
        pageCount: 0
      };
    }

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('error batches', error);
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

export const fetchBatchItems = cache(
  async (
    id: string,
  ): Promise<Result<any>> => {
    const supabase = await createClient();

    let query = supabase
      .from('batches')
      .select(`
        *,
        bills(*,connections!inner(account_number,paytype,biller_list!inner(*),sites!inner(*))),
        prepaid_recharge(*,connections!inner(account_number,paytype,biller_list!inner(*),sites!inner(*)))
      `)
      .eq('batch_id', id).single();
    const { data, error } = await query;
    if (error) {
      console.error('error batch items', error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }

    const bills = data.bills;
    const prepaidRecharge = data.prepaid_recharge;

    const batchItems = [...bills, ...prepaidRecharge];

    const { site_name } = await fetchOrganization();

    const modifiedData = batchItems.map((item) => {
      return {
        [`${site_name}_id`]: item.connections.sites.id,
        [`${site_name}_type`]: item.connections.sites.type,
        account_number: item.connections.account_number,
        biller_board: item.connections.biller_list.board_name,
        state: item.connections.biller_list.state,
        pay_type: PAY_TYPE[item.connections.paytype as keyof typeof PAY_TYPE],
        due_date: ddmmyy(getDueDate(item.discount_date, item.due_date)),
        discount_date: ddmmyy(item.discount_date),
        before_due_Amount: formatRupees(getBeforeDueAmount(item)),
        after_due_Amount: formatRupees(getAfterDueAmount(item)),
        recharge_date: ddmmyy(item.connections.paytype === 0 ? item?.recharge_date : null),
        approved_amount: formatRupees(item.connections.paytype === 0 ? item?.recharge_amount : item.approved_amount),
      }
    })

    return {
      data: modifiedData,
      totalCount: 0,
      pageCount: 0
    };
  }
);

