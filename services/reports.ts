import { cache } from 'react';
import { getPayment, processValues } from '@/lib/utils';
import { camelCaseToTitleCase, convertKeysToTitleCase } from '@/lib/utils/string-format';
import { formatRupees } from '@/lib/utils/number-format';
import { createClient } from '@/lib/supabase/server';
import { ddmmyy, getDueDate } from '@/lib/utils/date-format';
import { SupabaseError } from '@/types/supabase-type';
import { AllBillTableProps } from '@/types/bills-type';
import { SearchParamsProps } from '@/types';
import { ConnectionTableProps, PrepaidRechargeTableProps } from '@/types/connections-type';
import { PaidBillTableProps, PaymentTableProps } from '@/types/payments-type';
import { DlqMessagesTableProps } from '@/types/dlq-messages-type';
import { PAY_TYPE_LIST } from '@/constants/bill';
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
  export_data?: SearchParamsProps[];
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
};

export const fetchRegistrationReport = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<ConnectionTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
      status,
      updated_at_start,
      updated_at_end,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('connections')
      .select(`*,biller_list!inner(*),sites!inner(type)`, {
        count: 'estimated'
      })
      .eq('is_deleted', false);



    if (status) {
      if (status === '0') {
        query = query.eq('is_active', false);
      } else if (status === '1') {
        query = query.eq('is_active', true);
      }
    }

    if (type) {
      const value = type.split(',');
      query = query.in('sites.type', value);
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

    if (updated_at_start && updated_at_end) {
      query = query
        .gte('updated_at', updated_at_start)
        .lte('updated_at', updated_at_end);
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
        [`${site_name}_type`]: site.sites.type,
        account_number: String(site.account_number),
        biller_board: site.biller_list.board_name,
        state: site.biller_list.state,
        registration_date: ddmmyy(site.created_at),
        status: site.is_active ? 'Active' : 'Inactive'
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

export const fetchBillHistoryReport = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<AllBillTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      zone_id,
      account_number,
      due_date_start,
      due_date_end,
      bill_date_start,
      bill_date_end,
      bill_fetch_start,
      bill_fetch_end,
      discount_date_start,
      discount_date_end,
      site_id,
      biller_id,
      is_arrear,
      penalty,
      type,
      bill_status,
      is_active,
      connection_status,
      bill_type,
      sort,
      pay_type,
      bill_date_vs_fetch_date,
      bill_date_vs_due_date,
      is_overload,
      order = 'asc',
      is_rebate_eligible,
      paid_status
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('bills')
      .select(
        `*,
        additional_charges(*),
        adherence_charges(*),
        connections!inner(*,biller_list!inner(*),sites!inner(*))`,
        {
          count: 'estimated'
        })
      .eq('is_valid', true)
      .eq('is_deleted', false)

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('due_date', { ascending: true });
    }

    if (is_rebate_eligible) {
      query = query.gt('rebate_potential', 0);
    }

    if (connection_status) {
      const value = processValues(connection_status);
      query = query.in('connections.is_active', value);
    }

    if (bill_type) {
      const value = processValues(bill_type);
      query = query.in('bill_type', value);
    }

    if (bill_status) {
      const value = processValues(bill_status);
      query = query.in('bill_status', value);
    }

    if (is_active) {
      const value = processValues(is_active);
      query = query.in('is_active', value);
    }

    if (type) {
      const value = type.split(',');
      query = query.in('connections.sites.type', value);
    }

    if (is_arrear) {
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

    if (zone_id) {
      const value = zone_id.split(',');
      query = query.in('connections.sites.zone_id', value);
    }

    if (discount_date_start && discount_date_end) {
      query = query
        .gte('discount_date', discount_date_start)
        .lte('discount_date', discount_date_end);
    }

    if (due_date_start && due_date_end) {
      query = query
        .gte('due_date', due_date_start)
        .lte('due_date', due_date_end);
    }

    if (bill_fetch_start && bill_fetch_end) {
      query = query
        .gte('created_at', bill_fetch_start)
        .lte('created_at', bill_fetch_end + ' 23:59:59');
    }

    if (bill_date_start && bill_date_end) {
      query = query
        .gte('bill_date', bill_date_start)
        .lte('bill_date', bill_date_end);
    }

    if (bill_date_vs_fetch_date) {

      if (bill_date_vs_fetch_date === '0-3') {
        query = query.lte('days_created_vs_bill_date', 3);
      } else if (bill_date_vs_fetch_date === '4-7') {
        query = query.gte('days_created_vs_bill_date', 4).lte('days_created_vs_bill_date', 7);
      } else if (bill_date_vs_fetch_date === '7+') {
        query = query.gt('days_created_vs_bill_date', 7);
      }

    }

    if (bill_date_vs_due_date) {
      if (bill_date_vs_due_date === '0-3') {
        query = query.lte('days_due_vs_bill_date', 3);
      } else if (bill_date_vs_due_date === '4-7') {
        query = query.gte('days_due_vs_bill_date', 4).lte('days_due_vs_bill_date', 7);
      } else if (bill_date_vs_due_date === '7+') {
        query = query.gt('days_due_vs_bill_date', 7);
      }
    }

    if (pay_type) {
      const value = processValues(pay_type);
      query = query.in('connections.paytype', value);
    }

    if (is_overload) {
      query = query.eq('is_overload', is_overload === 'true');
    }
    if (paid_status) {
      query = query.eq('paid_status', paid_status);
    }


    if (options?.is_export) {

      const { data, error } = await query;
      const { site_name } = await fetchOrganization();

      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }

      const modifiedData = (data || []).map((site) => ({
        [`${site_name}_id`]: site.connections?.site_id || '',
        [`${site_name}_type`]: site.connections?.sites?.type || '',
        [`${site_name}_status`]: site.connections?.is_active ? 'Active' : 'Inactive',
        account_number: String(site.connections?.account_number || ''),
        biller_board: site.connections?.biller_list?.board_name || '',
        pay_type: PAY_TYPE_LIST.find((b) => b.value == site.connections?.paytype)?.name || '',
        bill_date: ddmmyy(site.bill_date),
        due_date: ddmmyy(getDueDate(site.discount_date, site.due_date)),
        bill_amount: site.bill_amount,
        bill_type: site.bill_type,
        bill_type_reason: Object.keys(site?.bill_type_reason || {}).filter(key => !(site?.bill_type_reason as Record<string, boolean>)[key]).map(key => camelCaseToTitleCase(key) + ' discrepancy').join(', '),
        payment_status: !site.connections?.is_active && !site.payment_status ? 'Carried Forward' : site.payment_status ? 'Paid' : 'Unpaid',
        bill_status: site.connections?.is_active ? 'Active' : 'Inactive',
        billed_unit: site.billed_unit,
        start_date: ddmmyy(site.start_date),
        end_date: ddmmyy(site.end_date),
        unit_cost: getUnitCostStatus(site),
        swap_cost: site.swap_cost,
        state: site.connections?.biller_list?.state || '',
        lpsc: site.adherence_charges?.lpsc,
        arrears: site.additional_charges?.arrears,
        potential_rebate: site.rebate_potential,
        accrued_rebate: site.rebate_accrued,
        fetch_date: ddmmyy(site.created_at),
        bill_number: site.bill_number,
        address: site.connections?.address || '',
        consumer_name: site.connections?.name || '',
        batch_id: site.batch_id,
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

export const fetchPaymentHistoryReport = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<PaymentTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      account_number,
      site_id,
      biller_id,
      type
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('payments')
      .select(`*,connections!inner(*, biller_list!inner(*))`, {
        count: 'estimated'
      });

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
          batch_id: site.batch_id,
          consumer_name: site.connections.name,
          paid_amount: site.amount,
          pay_type: PAY_TYPE_LIST.find((b) => b.value == site.connections.paytype)
            ?.name,
          transaction_date:
            site.collection_date && ddmmyy(site.collection_date),
          transaction_id: site.reference_id
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

export const fetchRechargeReport = cache(
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
      type,
      sort,
      order = 'asc',
      recharge_status
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('prepaid_recharge')
      .select(`*,connections!inner(*, biller_list!inner(*),sites!inner(type))`, {
        count: 'estimated'
      })
      .eq('is_deleted', false)
      .eq('connections.is_deleted', false)
      .eq('connections.is_active', true);

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('recharge_date', { ascending: true });
    }

    if (recharge_status) {
      query = query.eq('recharge_status', recharge_status);
    }

    if (type) {
      const value = type.split(',');
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
          batch_id: site.batch_id,
          recharge_amount: site.recharge_amount,
          recharge_date: site.recharge_date && ddmmyy(site.recharge_date),
          recharge_status: site.recharge_status
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

export const fetchFailureReport = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result<DlqMessagesTableProps>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      dlq_type,
      account_number,
      biller_id,
      reason,
      created_at_start,
      created_at_end,
      view,
      status
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('dlq_messages')
      .select(`*,biller_list(*)`, {
        count: 'estimated'
      })

    // Default to only pending unless explicitly overridden
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'pending');
    }

    if (dlq_type) {
      const value = processValues(dlq_type);
      query = query.in('dlq_type', value);
    }

    if (account_number) {
      const value = processValues(account_number);
      query = query.in('account_number', value);
    }

    if (biller_id) {
      const value = processValues(biller_id);

      // Convert aliases to biller IDs
      const { data: billerList } = await supabase
        .from('biller_list')
        .select('id, alias')
        .in('alias', value);

      const billerIds = billerList?.map(biller => biller.id) || [];

      if (billerIds.length > 0) {
        query = query.in('biller_id', billerIds);
      }
    }

    if (reason) {
      // partial match on reason text
      query = query.ilike('reason', `%${reason}%`);
    }

    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    const isSummaryView = view === 'summary';

    if (options?.is_export || isSummaryView) {
      // For summary view or export, we need full result set
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }
      if (isSummaryView) {
        // First, get total failures from unfiltered data for percentage calculation
        const { data: totalData } = await supabase
          .from('dlq_messages')
          .select('*')
          .eq('status', 'pending');

        // Calculate total failures from unfiltered data
        const totalFailures = totalData?.length || 0;

        // Aggregate: DATE(created_at), dlq_type, biller_id, reason
        const aggregateMap = new Map<string, any>();
        for (const row of data || []) {
          const createdDate = row.created_at ? new Date(row.created_at) : null;
          const yyyy = createdDate ? createdDate.getFullYear() : 0;
          const mm = createdDate ? (createdDate.getMonth() + 1).toString().padStart(2, '0') : '00';
          const dd = createdDate ? createdDate.getDate().toString().padStart(2, '0') : '00';
          const dateKey = `${yyyy}-${mm}-${dd}`;
          const reasonKey = row.reason || '';
          const key = `${dateKey}|${row.dlq_type}|${row.biller_id}|${reasonKey}`;
          if (!aggregateMap.has(key)) {
            aggregateMap.set(key, {
              failure_date: dateKey,
              dlq_type: row.dlq_type,
              biller_id: row.biller_id,
              biller_board: row?.biller_list?.board_name || '',
              reason: row.reason || '',
              failure_count: 0
            });
          }
          const agg = aggregateMap.get(key);
          agg.failure_count += 1;
        }

        const aggregated = Array.from(aggregateMap.values());

        // Add failure_percentage to each aggregated item based on total unfiltered failures
        aggregated.forEach(item => {
          item.failure_percentage = totalFailures > 0 ? (item.failure_count / totalFailures) * 100 : 0;
        });

        // Sort by failure_date desc, failure_count desc
        aggregated.sort((a, b) => {
          if (a.failure_date === b.failure_date) {
            return b.failure_count - a.failure_count;
          }
          return a.failure_date > b.failure_date ? -1 : 1;
        });

        if (options?.is_export) {
          const modifiedData = aggregated.map((row) => {
            let dlqTypeDisplay = row.dlq_type;
            switch (row.dlq_type) {
              case 'pdf-dlq':
                dlqTypeDisplay = 'Extraction Failure';
                break;
              case 'payment-dlq':
                dlqTypeDisplay = 'Payment Failure';
                break;
              case 'activation-dlq':
                dlqTypeDisplay = 'Download Failure';
                break;
              case 'registration-dlq':
                dlqTypeDisplay = 'Register Failure';
                break;
              default:
                dlqTypeDisplay = row.dlq_type;
            }
            return {
              failure_date: row.failure_date,
              dlq_type: dlqTypeDisplay,
              biller_board: row.biller_board,
              reason: row.reason,
              failure_count: row.failure_count,
              failure_percentage: row.failure_percentage
            };
          });
          return {
            data: [],
            export_data: convertKeysToTitleCase(modifiedData),
            totalCount: 0,
            pageCount: 0
          };
        } else {
          const totalCount = aggregated.length;
          const pageCount = Math.ceil(totalCount / pageLimit);
          const paged = aggregated.slice(offset, offset + pageLimit);
          // @ts-ignore - returning aggregated data for summary view
          return {
            data: paged,
            totalCount,
            pageCount
          };
        }
      } else if (options?.is_export) {
        // Detailed export: map rows to export-friendly columns
        const modifiedData = (data || []).map((site) => {
          // Better date handling
          let formattedDate = 'N/A';
          if (site.created_at) {
            try {
              const date = new Date(site.created_at);
              if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                formattedDate = `${year}-${month}-${day}`;
              } else {
                formattedDate = 'Invalid Date';
              }
            } catch (error) {
              formattedDate = 'Invalid Date';
            }
          }

          // Map dlq_type to user-friendly names
          let dlqTypeDisplay = site.dlq_type;
          switch (site.dlq_type) {
            case 'pdf-dlq':
              dlqTypeDisplay = 'Extraction Failure';
              break;
            case 'payment-dlq':
              dlqTypeDisplay = 'Payment Failure';
              break;
            case 'activation-dlq':
              dlqTypeDisplay = 'Download Failure';
              break;
            case 'registration-dlq':
              dlqTypeDisplay = 'Register Failure';
              break;
            default:
              dlqTypeDisplay = site.dlq_type;
          }

          return {
            dlq_type: dlqTypeDisplay,
            account_number: site.account_number,
            biller_board: site.biller_list?.board_name || '',
            message_data: JSON.stringify(site.message_data),
            Date: formattedDate,
            reason: site.reason
          };
        });
        return {
          data: [],
          export_data: convertKeysToTitleCase(modifiedData),
          totalCount: 0,
          pageCount: 0
        };
      }
    }

    // Detailed view with server-side pagination
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

export const fetchArrearsReport = cache(
  async (): Promise<any> => {
    const supabase = await createClient();

    let query = supabase
      .from('arrear_amount')
      .select(`*,biller_list!inner(*)`)
      .or('bill_count.gt.0,positive_arrears.gt.0,negative_arrears.gt.0,bill_amount.gt.0,positive_arrear_bill_count.gt.0,negative_arrear_bill_count.gt.0');
    const { data, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        error: error
      };
    }
    return {
      data: data,
    };
  }
);

export const fetchPenaltiesReport = cache(
  async (): Promise<any> => {
    const supabase = await createClient();
    let query = supabase
      .from('penalties')
      .select(`*,biller_list!inner(*)`)
      .or(`lpsc.gt.0,tod_surcharge.gt.0,low_pf_surcharge.gt.0,sanctioned_load_penalty.gt.0,power_factor_penalty.gt.0,capacitor_surcharge.gt.0`)
    const { data, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        error: error
      };
    }
    return {
      data: data,
    };
  }
);


