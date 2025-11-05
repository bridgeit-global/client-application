import { cache } from 'react';
import {

  getLagAging,
  getPrepaidBalance,
  prepaidBalanceLagStatus,
  processValues
} from '@/lib/utils';
import { convertKeysToTitleCase } from '@/lib/utils/string-format';
import { createClient } from '@/lib/supabase/server';
import { ddmmyy } from '@/lib/utils/date-format';
import { ConnectionTableProps } from '@/types/connections-type';
import { SupabaseError } from '@/types/supabase-type';
import { SearchParamsProps } from '@/types';
import { RegistrationsProps } from '@/types/registrations-type';
import {
  SiteConnectionTableProps,
  SiteProfile,
  Connection
} from '@/types/site-type';
import { fetchOrganization } from './organization';

type ProfileResult = {
  data?: ConnectionTableProps;
  error?: SupabaseError;
};


type Result<TData> = {
  data: TData[];
  totalCount: number;
  pageCount: number;
  export_data?: SearchParamsProps[];
  error?: SupabaseError;
};

const getDateByDay = (day: number) => {
  const today = new Date();
  today.setDate(today.getDate() - day);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};


type SiteFormValues = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zone_id: string
  type: string;
};
export const fetchSiteDetails = cache(
  async (searchParams: SearchParamsProps): Promise<{ data: SiteFormValues, error: any }> => {
    const { id } = searchParams;
    const supabase = createClient(); // Assuming Supabase client is properly set up
    let query = supabase
      .from('sites')
      .select(`id, name, latitude, longitude, zone_id, type`)
      .match({ id: id })
      .single();

    // Execute the query and return the data
    const { data, error } = await query;
    if (error) {
      return {
        data: {
          id: '',
          name: '',
          latitude: 0,
          longitude: 0,
          zone_id: '',
          type: ''
        },
        error: error
      };
    }
    return {
      data: data,
      error: null
    };
  }
);

export const fetchSiteProfile = cache(
  async (searchParams: SearchParamsProps): Promise<ProfileResult> => {
    const { id } = searchParams;
    const supabase = createClient(); // Assuming Supabase client is properly set up
    let query = supabase
      .from('connections')
      .select(
        `*,
          biller_list!inner(*),
          payments(*),
          prepaid_balances(*),
          prepaid_recharge(*),
          prepaid_info(*),
          bills(*,
          connections!inner(*,biller_list!inner(*)),
          core_charges(*),
          regulatory_charges(*),
          adherence_charges(*),
          additional_charges(*))
          `
      )
      .match({ id: id, is_active: true, is_deleted: false })
      .eq('bills.is_valid', true)
      .eq('bills.is_deleted', false)
      .single();

    // Execute the query and return the data
    const { data, error } = await query;
    if (error) {
      return {
        error: error
      };
    }
    return {
      data: data
    };
  }
);

export const fetchAllConnections = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean; pay_type?: number }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
      status,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('connections')
      .select(
        `*,
         biller_list!inner(*),
         sites!inner(type),
         bills(bill_amount,billed_unit,due_date,discount_date,payment_status,is_active,is_valid,bill_status) `,
        {
          count: 'estimated'
        }
      )
      .match({ is_deleted: false, paytype: options?.pay_type });

    if (type) {
      const value = processValues(type);
      query = query.in('sites.type', value);
    }


    if (status) {
      if (status === '0') {
        query = query.eq('is_active', false);
      } else if (status === '1') {
        query = query.eq('is_active', true);
      }
    } else {
      // Default to active connections only for submeter
      query = query.eq('is_active', true);
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

      const modifiedData = data.map((site) => ({
        [`${site_name}_id`]: site.site_id,
        account_number: String(site.account_number),
        biller_board: site.biller_list.board_name,
        state: site.biller_list.state,
        connection_date: ddmmyy(site.connection_date),
        [`${site_name}_type`]: site.sites.type,
        type: site.connection_type,
        pay_type: site.paytype,
        security_deposit: site.security_deposit,
        registration_date: ddmmyy(site.created_at)
      }));

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

export const fetchPrepaidConnections = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean; pay_type?: number }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
      status,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('connections')
      .select(
        `*,
         biller_list!inner(*),
         prepaid_balances(*),
         prepaid_recharge(*),
         sites!inner(type)`,
        {
          count: 'estimated'
        }
      )
      .match({ is_deleted: false, paytype: options?.pay_type });

    if (type) {
      const value = processValues(type);
      query = query.in('sites.type', value);
    }

    if (status) {
      if (status === '0') {
        query = query.eq('is_active', false);
      } else if (status === '1') {
        query = query.eq('is_active', true);
      }
    } else {
      // Default to active connections only for prepaid
      query = query.eq('is_active', true);
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

      const modifiedData = data.map((site) => ({
        [`${site_name}_id`]: site.site_id,
        account_number: String(site.account_number),
        biller_board: site.biller_list.board_name,
        state: site.biller_list.state,
        connection_date: ddmmyy(site.connection_date),
        [`${site_name}_type`]: site.sites.type,
        type: site.connection_type,
        pay_type: site.paytype,
        security_deposit: site.security_deposit,
        registration_date: ddmmyy(site.created_at)
      }));

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

export const fetchAllSites = cache(
  async (
    searchParams: SearchParamsProps,
    is_export?: { is_export?: boolean }
  ): Promise<Result<SiteConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      name,
      site_id,
      type,
      zone_id,
      status
    } = searchParams;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('sites')
      .select(`*,connections(account_number,paytype,biller_list!inner(*))`, {
        count: 'estimated'
      }).order('created_at', { ascending: false }).eq("connections.is_deleted", false);


    if (status) {
      if (status === '0') {
        query = query.eq('is_active', false);
      } else if (status === '1') {
        query = query.eq('is_active', true);
      }
    }

    if (type) {
      const value = processValues(type);
      query = query.in('type', value);
    }

    if (site_id) {
      const value = processValues(site_id);
      query = query.in('id', value);
    }

    if (name) {
      const value = processValues(name);
      query = query.in('name', value);
    }

    if (zone_id) {
      const value = processValues(zone_id);
      query = query.in('zone_id', value);
    }

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (is_export) {
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

      const modifiedData = data.map((site) => ({
        [`${site_name}_id`]: site.id,
        [`${site_name}_name`]: site.name,
        [`${site_name}_type`]: site.type,
        registration_date: ddmmyy(site.created_at)
      }));

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


export const fetchLagSites = cache(
  async (
    searchParams: SearchParamsProps,
    is_export?: { is_export?: boolean }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
      lag_type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('connections')
      .select('*,biller_list!inner(board_name,state),bills(*)', { count: 'exact' })
      .match({ is_deleted: false, is_active: true })
      .eq('bills.is_active', true)
      .eq('bills.is_deleted', false);

    const five_day = getDateByDay(5);
    const six_day = getDateByDay(6);
    const ten_day = getDateByDay(10);
    const forty_five_days_future = new Date();
    forty_five_days_future.setDate(forty_five_days_future.getDate() + 45);
    const forty_five_days_future_str = forty_five_days_future.toISOString().split('T')[0];
    const one_day = getDateByDay(1);
    if (lag_type) {
      if (lag_type === '2') {
        query.or(
          `and(next_bill_date.gte.${five_day},next_bill_date.lte.${today}),and(next_bill_date.is.null,created_at.gte.${five_day},created_at.lte.${today})`
        );
      } else if (lag_type === '1') {
        query.or(
          `and(next_bill_date.gte.${ten_day},next_bill_date.lte.${six_day}),and(next_bill_date.is.null,created_at.gte.${ten_day},created_at.lte.${six_day})`
        );
      } else if (lag_type === '0') {
        query.or(
          `next_bill_date.lt.${ten_day},and(next_bill_date.is.null,created_at.lt.${ten_day})`
        );
      } else if (lag_type === 'no_lag') {
        // For no lag sites (aging <= 0 but > -45 days), we need to find sites where next_bill_date is in the future but not too far
        query.or(
          `and(next_bill_date.gt.${today},next_bill_date.lte.${forty_five_days_future_str}),and(next_bill_date.is.null,created_at.gt.${one_day})`
        );
      } else if (lag_type === 'abnormal') {
        // For abnormal sites (aging <= -45 days), we need to find sites where next_bill_date is far in the future
        query.or(
          `next_bill_date.gt.${forty_five_days_future_str}`
        );
      }
    } else {
      query.or(
        `next_bill_date.lt.${today}`
      );
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

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (is_export) {
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
        const agingInDays = getLagAging(site);
        let laggedDaysDisplay;

        if (agingInDays <= -45) {
          laggedDaysDisplay = 'Abnormal';
        } else if (agingInDays <= 0) {
          laggedDaysDisplay = 'No Lag';
        } else {
          laggedDaysDisplay = agingInDays;
        }

        return {
          id: site.id,
          [`${site_name}_id`]: site.site_id,
          account_number: String(site.account_number),
          biller_board: site.biller_list.board_name,
          state: site.biller_list.state,
          lagged_days: laggedDaysDisplay,
          registration_date: ddmmyy(site.created_at),
          start_date: ddmmyy(site.bills[0]?.start_date),
          end_date: ddmmyy(site.bills[0]?.end_date),
          last_bill_date: ddmmyy(site.bills[0]?.bill_date),
          next_bill_date: ddmmyy(site.next_bill_date)
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
    // add sort by next bill date ascending
    query = query.order('next_bill_date', { ascending: true });

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

export const fetchNotFetchBills = cache(
  async (
    searchParams: SearchParamsProps,
    is_export?: { is_export?: boolean }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('connections')
      .select('*,biller_list!inner(board_name,state)', { count: 'estimated' })
      .is('next_bill_date', null)
      .match({ is_deleted: false, is_active: true });

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

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (is_export) {
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
        const agingInDays = getLagAging(site);
        return {
          id: site.id,
          [`${site_name}_id`]: site.site_id,
          account_number: String(site.account_number),
          biller_board: site.biller_list.board_name,
          state: site.biller_list.state,
          lagged_days: agingInDays,
          registration_date: ddmmyy(site.created_at),
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

export const fetchPrepaidBalanceLag = cache(
  async (
    searchParams: SearchParamsProps,
    is_export?: { is_export?: boolean }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    let query = supabase
      .from('connections')
      .select('*,prepaid_balances(*),biller_id,name,biller_list!inner(*)', {
        count: 'estimated'
      })
      .match({ is_deleted: false, paytype: 0, is_active: true });
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

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (is_export) {
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
        const lag_status = prepaidBalanceLagStatus(site.prepaid_balances);
        const prepaid_balances = getPrepaidBalance(site.prepaid_balances);
        return {
          id: site.id,
          [`${site_name}_id`]: site.site_id,
          account_number: String(site.account_number),
          biller_board: site.biller_list.board_name,
          state: site.biller_list.state,
          balance_amount: prepaid_balances?.balance_amount,
          lag_status: lag_status.title
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

export const fetchLogSites = cache(
  async (
    searchParams: SearchParamsProps,
    is_export?: { is_export?: boolean }
  ): Promise<Result<RegistrationsProps>> => {
    const { status = 'all', page = 1, limit = 10 } = searchParams;
    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    const supabase = createClient();
    let query = supabase
      .from('registrations')
      .select(
        `
          *
        `,
        { count: 'estimated' }
      )
      .is('parent_id', null);
    if (status) {
      query = query.eq('status', status);
    }

    if (is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }
      return {
        data: data,
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

export const fetchActiveCount = cache(
  async (
    pay_type: string
  ): Promise<{ active_count: number }> => {
    const supabase = createClient();
    let query = supabase
      .from('dashboard_data')
      .select(`value`)
      .eq('path', pay_type).eq('page', 'count').single();

    const { data, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        active_count: 0
      }
    }
    return {
      active_count: data?.value || 0
    }
  }

);

export const getConnections = cache(async (siteId: string): Promise<Connection[] | null> => {
  if (!siteId) return null;

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('connections')
      .select(`
                *,
                biller_list!inner(*),
                bills (
                    *,
                    is_active,
                    is_valid
                ),
                prepaid_recharge (*),
                prepaid_info (*),
                prepaid_balances (*)
            `)
      .eq('site_id', siteId);

    if (error) {
      console.error('Error fetching connections:', error);
      return null;
    }

    if (!data || !Array.isArray(data)) {
      console.error('No connections found or invalid data format for site:', siteId);
      return null;
    }

    return data.map(connection => ({
      id: connection.id,
      account_number: connection.account_number,
      connection_type: connection.connection_type,
      tariff: connection.tariff,
      is_active: connection.is_active,
      biller_list: connection.biller_list,
      paytype: connection.paytype,
      bills: connection.bills || [],
      prepaid_recharge: connection.prepaid_recharge || [],
      prepaid_info: connection.prepaid_info,
      prepaid_balances: connection.prepaid_balances || [],
      security_deposit: connection.security_deposit || 0
    }));
  } catch (error) {
    console.error('Unexpected error fetching connections:', error);
    return null;
  }
});

export const getSiteProfile = cache(async (id: string): Promise<SiteProfile | null> => {
  if (!id) return null;

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching site profile:', error);
      return null;
    }

    if (!data) {
      console.error('No site found with id:', id);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      zone_id: data.zone_id,
      type: data.type,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Unexpected error fetching site profile:', error);
    return null;
  }
});
