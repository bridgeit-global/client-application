import { ddmmyy, getDueDate } from '@/lib/utils/date-format';
import { createClient } from '@/lib/supabase/server';
import {
  calculateAging,
  getChartData,
  processValues,
  getBeforeDueAmount,
  getAfterDueAmount
} from '@/lib/utils';
import { camelCaseToTitleCase, convertKeysToTitleCase } from '@/lib/utils/string-format';
import { formatRupees } from '@/lib/utils/number-format';
import { SearchParamsProps } from '@/types';
import {
  AllBillTableProps,
  BillsProps,
  CardResult,
  SingleBillProps
} from '@/types/bills-type';
import { LowBalanceConnectionTableProps, PrepaidRechargeTableProps } from '@/types/connections-type';
import { SupabaseError } from '@/types/supabase-type';
import { addDays } from 'date-fns';
import { cache } from 'react';
import { fetchOrganization } from './organization';


const getUnitCostStatus = (site: AllBillTableProps) => {
  const isNormalBill = site.bill_type.toLowerCase() === 'normal';
  let statusMessage = '';

  if (!isNormalBill) {
    statusMessage = 'Abnormal Bill';
  } else if (site.billed_unit < 1000) {
    statusMessage = 'Insufficient unit consumed';
  }

  if (statusMessage) {
    return statusMessage;
  }

  return site.unit_cost ? formatRupees(site.unit_cost) : null;
};

type Result<TData> = {
  data: TData[];
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
  totalAmount?: number;
  export_data?: SearchParamsProps[];
};

type SingleResult<TData> = {
  data: TData | null;
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
  totalAmount?: number;
};

export const fetchSingleBill = async (
  searchParams: SearchParamsProps
): Promise<SingleResult<SingleBillProps>> => {
  // Initialize the Supabase client
  const supabase = createClient();
  
  // Validate the ID parameter
  if (!searchParams.id) {
    return {
      data: null,
      totalCount: 0,
      pageCount: 0,
      error: {
        code: 'INVALID_PARAMS',
        message: 'Bill ID is required'
      }
    };
  }

  console.log('Fetching bill with ID:', searchParams.id);
  
  // First try the full query with all relationships
  let { data, error } = await supabase
    .from('bills')
    .select(
      '*,additional_charges(*),adherence_charges(*),connections(*,bills(bill_type,is_valid,billed_unit),biller_list(*),payments(amount)),bills_approved_logs(*),core_charges(*),regulatory_charges(*),meter_readings(*)'
    )
    .eq('id', searchParams.id)
    .single();

  // If the full query fails with PGRST116, try a simpler query with just the bill and essential relationships
  if (error && error.code === 'PGRST116') {
    console.log('Full query failed, trying simplified query for bill ID:', searchParams.id);
    
    const { data: simpleData, error: simpleError } = await supabase
      .from('bills')
      .select(
        '*,connections(*,biller_list(*),payments(amount))'
      )
      .eq('id', searchParams.id)
      .single();
    
    if (simpleError) {
      console.error('Error fetching single bill (simplified query):', simpleError);
      return {
        data: null,
        totalCount: 0,
        pageCount: 0,
        error: simpleError
      };
    }
    
    data = simpleData;
    error = null;
  }

  if (error) {
    console.error('Error fetching single bill:', error);
    
    // Handle specific error cases
    if (error.code === 'PGRST116') {
      console.log(`Bill with ID ${searchParams.id} not found`);
    }
    
    return {
      data: null,
      totalCount: 0,
      pageCount: 0,
      error
    };
  }

  return {
    data: data,
    totalCount: 0,
    pageCount: 0
  };
};

export const fetchBillRecords = cache(async (): Promise<CardResult> => {
  const supabase = createClient();

  let query = supabase
    .from('bills')
    .select('*,connections!inner(id,site_id,payments(amount),is_active)', {
      count: 'estimated'
    })
    .match({ is_active: true, is_valid: true, is_deleted: false })
    .eq('connections.is_active', true);

  const { data: graphData, error: chartError } = await query;
  let all_bill_amount = 0;
  graphData?.map((e) => {
    if (e.payment_status == true) {
      all_bill_amount += e.billed_unit;
    }
  });
  const { data: dueDateSummary, error: dueDateError } = await supabase
    .from('due_summary')
    .select('*').match({
      fetch_date: new Date().toISOString().split('T')[0],
      type: 'bill'
    }).order('index', { ascending: true });

  if (dueDateError) {
    console.error('Error fetching dueDateSummary data:', dueDateError);
    return {
      chartDueDataData: [],
      chartDiscountDataData: [],
      all_bill_amount: all_bill_amount,
      dueSummaryData: [],
      lagCount: 0
    };
  }

  if (chartError) {
    console.error('Error fetching chart data:', chartError);
    return {
      chartDueDataData: [],
      chartDiscountDataData: [],
      all_bill_amount: all_bill_amount,
      dueSummaryData: [],
      lagCount: 0
    };
  }
  const chartDueDataData = getChartData(graphData || [], 'due_date');
  const chartDiscountDataData = getChartData(graphData || [], 'discount_date');

  let lagBill = supabase
    .from('connections')
    .select('next_bill_date')
    .not('next_bill_date', 'is', null)
    .lte('next_bill_date', new Date().toISOString().split('T')[0]);

  const { data: lagReport, error: lagError } = await lagBill;

  const lagData = calculateAging(lagReport || []).agingGroupCounts;
  let lagCount = 0;

  lagData.forEach((e) => {
    lagCount += e.count;
  });

  if (lagError) {
    console.error('Error fetching lagError data:', lagError);
    return {
      chartDueDataData: [],
      chartDiscountDataData: [],
      all_bill_amount: all_bill_amount,
      dueSummaryData: [],
      lagCount: lagCount
    };
  }

  return {
    chartDueDataData,
    chartDiscountDataData,
    all_bill_amount: all_bill_amount,
    dueSummaryData: dueDateSummary,
    lagCount: lagCount
  };
});



export const fetchNewBills = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<AllBillTableProps>> => {
    const supabase = createClient();
    const {
      bill_date_end,
      bill_date_start,
      biller_id,
      due_date_end,
      due_date_start,
      site_id,
      account_number,
      payment_status,
      is_arrear,
      penalty,
      page = 1,
      limit = 10,
      type,
      bill_category,
      sort,
      order = 'asc'
    } = searchParams;

    let totalAmount = 0;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('bills')
      .select(
        '*,additional_charges(*),adherence_charges(*),connections!inner(id,site_id,biller_list!inner(*),payments(amount),account_number,paytype,is_active,bills(billed_unit,bill_type,is_valid))',
        {
          count: 'estimated'
        }
      )
      .match({ is_active: true, is_valid: true, bill_status: 'new', payment_status: false, is_deleted: false })
      .not('connections.paytype', 'eq', 0)
      .eq('connections.is_active', true)

    // Apply sorting if sort parameter is provided
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      // Keep the default sorting by due_date if no sort parameter
      query = query.order('due_date', { ascending: true });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const sevenDaysFromToday = new Date();
    sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);
    const fourteenDaysFromToday = new Date();
    fourteenDaysFromToday.setDate(fourteenDaysFromToday.getDate() + 14);

    if (bill_category === 'overdue') {
      // Bills whose due date is before today
      query = query.lt('due_date', todayDate);
    } else if (bill_category === 'seven_day') {
      // Bills due within next 7 days (including today)
      query = query
        .gte('due_date', todayDate)
        .lt('due_date', sevenDaysFromToday.toISOString().split('T')[0]);
    } else if (bill_category === 'next_seven_day') {
      // Bills due between 7 and 14 days from today
      query = query
        .gte('due_date', sevenDaysFromToday.toISOString().split('T')[0])
        .lt('due_date', fourteenDaysFromToday.toISOString().split('T')[0]);
    }

    if (is_arrear == 'true') {
      query = query.not('additional_charges', 'is', null)
        .gt('additional_charges.arrears', 0)
    } else if (is_arrear == 'false') {
      query = query.not('additional_charges', 'is', null).lt('additional_charges.arrears', 0)
    }

    if (penalty) {
      const penaltyArray = Array.isArray(penalty) ? penalty : [penalty];
      penaltyArray.map((e) => {
        query = query.not('adherence_charges', 'is', null).gt(`adherence_charges.${e}`, 0)
      })
    }

    if (type) {
      const value = processValues(type);
      query = query.in('station_type', value);
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

    if (due_date_start && due_date_end) {
      query = query
        .gte('due_date', due_date_start)
        .lte('due_date', due_date_end);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    if (options?.is_export) {
      const { data, error } = await query;

      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          totalAmount,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site.station_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: 'postpaid',
          bill_number: site.bill_number,
          bill_date: ddmmyy(site.bill_date),
          due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
          bill_amount: site.bill_amount,
          before_due_amount: getBeforeDueAmount(site),
          after_due_amount: getAfterDueAmount(site),
          bill_type: site.bill_type,
          bill_type_reason: Object.keys(site?.bill_type_reason || {}).filter(key => !(site?.bill_type_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
          billed_unit: site.billed_unit,
          unit_cost: getUnitCostStatus(site),
          swap_cost: site.swap_cost,
          start_date: ddmmyy(site.start_date),
          end_date: ddmmyy(site.end_date),
          arrears: site.additional_charges?.arrears,
          penalty: site.adherence_charges?.lpsc,
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
        totalAmount,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount,
      totalAmount
    };
  }
);


export const fetchApprovedPostpaidBills = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<AllBillTableProps>> => {
    const supabase = createClient();
    const {
      bill_date_end,
      bill_date_start,
      biller_id,
      due_date_end,
      due_date_start,
      site_id,
      account_number,
      payment_status,
      is_arrear,
      penalty,
      page = 1,
      limit = 10,
      type,
      sort,
      order = 'asc',
      bill_category
    } = searchParams;

    let totalAmount = 0;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('bills')
      .select(
        '*,additional_charges(*),adherence_charges(*),connections!inner(id,site_id,biller_list!inner(*),payments(amount),account_number,paytype,is_active,bills(billed_unit,bill_type,is_valid,bill_amount,is_active,is_valid))',
        {
          count: 'estimated'
        }
      )
      .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
      .not('connections.paytype', 'eq', 0)
      .eq('connections.is_active', true)
      .eq('connections.is_deleted', false)

    // Apply sorting if sort parameter is provided
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      // Keep the default sorting by due_date if no sort parameter
      query = query.order('updated_at', { ascending: false });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const sevenDaysFromToday = new Date();
    sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);
    const fourteenDaysFromToday = new Date();
    fourteenDaysFromToday.setDate(fourteenDaysFromToday.getDate() + 14);

    if (bill_category === 'overdue') {
      // Bills whose due date is before today
      query = query.lt('due_date', todayDate);
    } else if (bill_category === 'seven_day') {
      // Bills due within next 7 days (including today)
      query = query
        .gte('due_date', todayDate)
        .lt('due_date', sevenDaysFromToday.toISOString().split('T')[0]);
    } else if (bill_category === 'next_seven_day') {
      // Bills due between 7 and 14 days from today
      query = query
        .gte('due_date', sevenDaysFromToday.toISOString().split('T')[0])
        .lt('due_date', fourteenDaysFromToday.toISOString().split('T')[0]);
    }

    if (is_arrear == 'true') {
      query = query.not('additional_charges', 'is', null)
        .gt('additional_charges.arrears', 0)
    } else if (is_arrear == 'false') {
      query = query.not('additional_charges', 'is', null).lt('additional_charges.arrears', 0)
    }

    if (penalty) {
      const penaltyArray = Array.isArray(penalty) ? penalty : [penalty];
      penaltyArray.map((e) => {
        query = query.not('adherence_charges', 'is', null).gt(`adherence_charges.${e}`, 0)
      })
    }

    if (type) {
      const value = processValues(type);
      query = query.in('station_type', value);
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

    if (due_date_start && due_date_end) {
      query = query
        .gte('due_date', due_date_start)
        .lte('due_date', due_date_end);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    if (options?.is_export) {
      const { data, error } = await query;

      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          totalAmount,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site.station_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: 'postpaid',
          bill_number: site.bill_number,
          bill_date: ddmmyy(site.bill_date),
          due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
          bill_amount: site.bill_amount,
          before_due_amount: getBeforeDueAmount(site),
          after_due_amount: getAfterDueAmount(site),
          approved_amount: site.approved_amount,
          bill_type: site.bill_type,
          bill_type_reason: Object.keys(site?.bill_type_reason || {}).filter(key => !(site?.bill_type_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
          payment_status: site.payment_status ? 'Paid' : 'Unpaid',
          billed_unit: site.billed_unit,
          unit_cost: getUnitCostStatus(site),
          swap_cost: site.swap_cost,
          start_date: ddmmyy(site.start_date),
          end_date: ddmmyy(site.end_date),
          arrears: site.additional_charges?.arrears,
          penalty: site.adherence_charges?.lpsc,
          batch_id: site.batch_id
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
        totalAmount,
        error: error
      };
    }
    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount,
      totalAmount
    };
  }
);

export const fetchPostpaidAllBills = cache(async (searchParams: SearchParamsProps): Promise<Result<BillsProps>> => {
  const {
    type
  } = searchParams;

  const supabase = createClient();
  let query = supabase
    .from('bills')
    .select(
      'id, bill_date, due_date, bill_status, bill_amount, connections!inner(paytype), payment_status',
      {
        count: 'estimated'
      }
    )
    .not('bill_status', 'eq', 'rejected')
    .eq('is_active', true)
    .eq('is_valid', true)
    .eq('is_deleted', false)
    .eq('connections.is_active', true)
    .not('connections.paytype', 'eq', 0)
    .eq('connections.is_deleted', false)
    .or('bill_status.neq.new,and(bill_status.eq.new,payment_status.eq.false)');

  if (type) {
    const value = processValues(type);
    query = query.in('station_type', value);
  }

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


  // Transform data to match AllBillTableProps
  const transformedData = data.map(item => ({
    id: item.id,
    bill_date: item.bill_date,
    due_date: item.due_date,
    bill_status: item.bill_status,
    bill_amount: item.bill_amount
  }));

  const totalCount = count || 0;
  return {
    data: transformedData as BillsProps[],
    totalCount,
    pageCount: 1
  };
}
);

export const fetchAllBills = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<AllBillTableProps>> => {
    const {
      page = 1,
      limit = 10,
      account_number,
      site_id,
      biller_id,
      is_valid,
      is_active,
      paytype,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    // Initialize the Supabase client
    const supabase = createClient(); // Assuming Supabase client is properly set up

    let query = supabase
      .from('bills')
      .select(
        '*, connections!inner(id,site_id,biller_list!inner(*),payments(amount),account_number,paytype,is_active)',
        {
          count: 'estimated'
        }
      )
      .eq('connections.is_active', true)
      .eq('is_deleted', false)
      .order('is_valid', {
        ascending: true
      })

    if (paytype) {
      query = query.eq('connections.paytype', paytype)
    }
    if (is_valid) {
      query = query.eq('is_valid', is_valid)
    }

    if (is_active) {
      query = query.eq('is_active', is_active)
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

    if (type) {
      const value = processValues(type);
      query = query.in('station_type', value);
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
          [`${site_name}_type`]: site.station_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          bill_type: site.bill_type,
          bill_type_reason: Object.keys(site?.bill_type_reason || {}).filter(key => !(site?.bill_type_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
          remark: Object.keys(site?.validation_reason || {}).filter(key => !(site?.validation_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
          validation: site.is_valid ? 'Valid' : 'Invalid'
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
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error
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

export const fetchPrepaidAllBills = cache(async (searchParams: SearchParamsProps): Promise<Result<any>> => {
  const supabase = createClient();
  const {
    type
  } = searchParams;
  try {
    // First query: Get prepaid recharges data
    let rechargeQuery = supabase
      .from('prepaid_recharge')
      .select(
        'id,connection_id, recharge_date, recharge_status, recharge_amount, connections!inner(paytype,sites(type))',
        {
          count: 'estimated'
        }
      )
      .eq('connections.is_active', true)
      .not('recharge_status', 'eq', 'rejected')
      .eq('is_active', true)
      .eq('connections.paytype', 0);

    if (type) {
      const value = processValues(type);
      rechargeQuery = rechargeQuery.in('connections.sites.type', value);
    }

    // Second query: Get low balance connections data
    const lowBalanceQuery = supabase
      .from('low_balance_connections')
      .select(
        'id, fetch_date,current_status,threshold_amount',
        {
          count: 'estimated'
        }
      );

    // Execute both queries
    const [rechargeResult, lowBalanceResult] = await Promise.all([
      rechargeQuery,
      lowBalanceQuery
    ]);

    if (rechargeResult.error) {
      console.error('Error fetching prepaid recharges:', rechargeResult.error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: rechargeResult.error
      };
    }

    if (lowBalanceResult.error) {
      console.error('Error fetching low balance connections:', lowBalanceResult.error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: lowBalanceResult.error
      };
    }

    // Transform recharge data
    const rechargeData = rechargeResult.data.map(item => ({
      id: item.connection_id,
      recharge_date: item.recharge_date,
      recharge_status: item.recharge_status,
      recharge_amount: item.recharge_amount,
      current_status: true // These are existing recharges
    }));

    // Transform low balance data
    const lowBalanceData = lowBalanceResult.data.map(item => ({
      id: item.id,
      recharge_date: item.fetch_date,
      recharge_status: 'new',
      recharge_amount: item.threshold_amount,
      current_status: item.current_status,
    }));

    // Combine both datasets, only adding low balance items that don't exist in recharge data
    const combinedData = [
      ...rechargeData,
      ...lowBalanceData.filter(lowBalanceItem =>
        !rechargeData.some(rechargeItem => rechargeItem.id === lowBalanceItem.id)
      )
    ];

    return {
      data: combinedData,
      totalCount: combinedData.length,
      pageCount: 1
    };
  } catch (error) {
    console.error('Error in fetchPrepaidAllBills:', error);
    return {
      data: [],
      totalCount: 0,
      pageCount: 0,
      error: error as Error
    };
  }
});

export const fetchLowBalanceConnections = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<LowBalanceConnectionTableProps>> => {
    const supabase = createClient();
    const {
      biller_id,
      site_id,
      account_number,
      page = 1,
      limit = 10,
      type
    } = searchParams;

    let totalAmount = 0;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('low_balance_connections')
      .select(
        '*,biller_list!inner(*)',

        {
          count: 'estimated'
        }
      )
      .match({
        is_active: true,
        is_deleted: false,
        paytype: 0
      })

    if (type) {
      const value = processValues(type);
      query = query.in('station_type', value);
    }

    if (biller_id) {
      const value = processValues(biller_id);
      query = query.in('biller_list.alias', value);
    }

    if (site_id) {
      const value = processValues(site_id);
      query = query.in('site_id', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('account_number', value);
    }

    if (options?.is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          totalAmount,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.site_id,
          [`${site_name}_type`]: site.station_type,
          account_number: String(site.account_number),
          biller_board: site.biller_list.board_name,
          state: site.biller_list.state,
          pay_type: 'prepaid',
          balance: site.prepaid_balances.balance,
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
        totalAmount,
        error: error
      };
    }

    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);

    return {
      data: data,
      totalCount,
      pageCount,
      totalAmount
    };
  }
);

export const fetchApprovedPrepaidRecharges = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<PrepaidRechargeTableProps>> => {
    const supabase = createClient();
    const {
      recharge_date_end,
      recharge_date_start,
      biller_id,
      site_id,
      account_number,
      page = 1,
      limit = 10,
      type
    } = searchParams;

    let totalAmount = 0;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('prepaid_recharge')
      .select(
        '*,connections!inner(*,biller_list!inner(*),sites!inner(*))',
        {
          count: 'estimated'
        }
      )
      .eq('connections.paytype', 0)
      .eq('connections.is_active', true)
      .eq('recharge_status', 'approved')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (type) {
      const value = processValues(type);
      query = query.in('connections.sites.type', value);
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
          totalAmount,
          error: error
        };
      }
      const { site_name } = await fetchOrganization();

      const modifiedData = data.map((site) => {
        return {
          [`${site_name}_id`]: site.connections.site_id,
          [`${site_name}_type`]: site.station_type,
          account_number: String(site.connections.account_number),
          biller_board: site.connections.biller_list.board_name,
          state: site.connections.biller_list.state,
          pay_type: 'prepaid',
          bill_number: site.bill_number,
          bill_date: ddmmyy(site.bill_date),
          due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
          bill_amount: site.bill_amount,
          bill_type: site.bill_type,
          bill_type_reason: Object.keys(site?.bill_type_reason || {}).filter(key => !(site?.bill_type_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
          payment_status: site.payment_status ? 'Paid' : 'Unpaid',
          billed_unit: site.billed_unit,
          unit_cost: getUnitCostStatus(site),
          swap_cost: site.swap_cost,
          start_date: ddmmyy(site.start_date),
          end_date: ddmmyy(site.end_date),
          batch_id: site.batch_id
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
        totalAmount,
        error: error
      };
    }

    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);
    return {
      data: data,
      totalCount,
      pageCount,
      totalAmount
    };
  }
);


export const fetchBillRecommendations = cache(async (): Promise<{
  totalBillsData: AllBillTableProps[] | null;
  overdueBillsData: AllBillTableProps[] | null;
  discountDateBillsData: AllBillTableProps[] | null;
  currentDueBillsData: AllBillTableProps[] | null;
  nextSevenDaysBillsData: AllBillTableProps[] | null;
}> => {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get total bills count
  const { data: totalBillsData } = await supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
    .not('connections.paytype', 'eq', 0)
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false)

  // Get overdue bills count (bills with due date < today)
  const { data: overdueBillsData } = await supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
    .lt('due_date', today)
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false)
    .not('connections.paytype', 'eq', 0);

  // Get bills within discount date (bills with discount_date >= today AND due_date = today)
  const { data: discountDateBillsData } = await supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
    .gte('discount_date', today)
    .eq('due_date', today)
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false)
    .not('connections.paytype', 'eq', 0);

  // Get current due bills (bills due today that are not in discount period)
  const { data: currentDueBillsData } = await supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
    .eq('due_date', today)
    .lt('discount_date', today)
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false)
    .not('connections.paytype', 'eq', 0);

  // Get next seven days bills (excluding today)
  const tomorrow = addDays(new Date(today), 1).toISOString().split('T')[0];
  const sevenDaysFromToday = addDays(new Date(today), 7).toISOString().split('T')[0];

  const { data: nextSevenDaysBillsData } = await supabase
    .from('bills')
    .select('*,connections!inner(*,biller_list!inner(*))', { count: 'exact' })
    .match({ is_active: true, is_valid: true, payment_status: false, bill_status: 'approved', is_deleted: false })
    .gte('due_date', tomorrow)
    .lte('due_date', sevenDaysFromToday)
    .eq('connections.is_active', true)
    .eq('connections.is_deleted', false)
    .not('connections.paytype', 'eq', 0);

  return {
    totalBillsData: totalBillsData || [],
    overdueBillsData: overdueBillsData || [],
    discountDateBillsData: discountDateBillsData || [],
    currentDueBillsData: currentDueBillsData || [],
    nextSevenDaysBillsData: nextSevenDaysBillsData || []
  };
});


export const fetchRechargeRecommendations = cache(async (): Promise<{
  totalRechargesData: PrepaidRechargeTableProps[] | null;
  currentDueRechargesData: PrepaidRechargeTableProps[] | null;
  nextSevenDaysRechargesData: PrepaidRechargeTableProps[] | null;
}> => {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get total bills count
  const { data: totalRechargesData } = await supabase
    .from('prepaid_recharge')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({
      is_active: true,
      recharge_status: 'approved',
      is_deleted: false
    })
    .eq('connections.is_active', true);


  // Get overdue bills count (bills with due date < today)
  const { data: currentDueRechargesData } = await supabase
    .from('prepaid_recharge')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({
      is_active: true,
      is_deleted: false,
      recharge_status: 'approved',
    })
    .eq('recharge_date', today)
    .eq('connections.is_active', true);

  // Get next seven days bills (excluding today)
  const tomorrow = addDays(new Date(today), 1).toISOString().split('T')[0];
  const sevenDaysFromToday = addDays(new Date(today), 7).toISOString().split('T')[0];

  const { data: nextSevenDaysRechargesData } = await supabase
    .from('prepaid_recharge')
    .select('*,connections!inner(*,biller_list!inner(*))')
    .match({
      is_active: true,
      is_deleted: false,
      recharge_status: 'approved'
    })
    .gte('recharge_date', tomorrow)
    .lte('recharge_date', sevenDaysFromToday)
    .eq('connections.is_active', true);

  return {
    totalRechargesData: totalRechargesData || [],
    currentDueRechargesData: currentDueRechargesData || [],
    nextSevenDaysRechargesData: nextSevenDaysRechargesData || []
  };
});