import {
  fetchBatchItems,
  fetchBillsInBatches,
  fetchRechargesInBatches,
} from '@/services/batches';
import {
  fetchAllBills,
  fetchNewBills
} from '@/services/bills';
import {
  fetchPaymentEdit,
  fetchPostpaidPaid,
  fetchPrepaidPaid,
  fetchClientWallet,
  fetchRechargePaymentEdit
} from '@/services/payments';
import { fetchRegistrations } from '@/services/registrations';
import {
  fetchBillHistoryReport,
  fetchPaymentHistoryReport,
  fetchRegistrationReport,
  fetchFailureReport,
  fetchRechargeReport,
} from '@/services/reports';
import {
  fetchAllConnections,
  fetchAllSites,
  fetchLagSites,
  fetchNotFetchBills,
  fetchPrepaidBalanceLag
} from '@/services/sites';
import { fetchSubmeterReadings } from '@/services/submeter-readings';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

function getParams(queryString: string): Record<string, string> {
  const queryPart = queryString.includes('?')
    ? queryString.split('?')[1]
    : queryString;
  const pairs = queryPart.split('&');
  return pairs.reduce(
    (params, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value); // Decode in case of URL encoding
      }
      return params;
    },
    {} as Record<string, string>
  );
}

async function fetchMeterReadingsForBills(
  searchParams: Record<string, string>,
  table: string,
  param?: string
): Promise<any[]> {
  const supabase = await createClient();
  
  try {
    // First, query bills with the same filters to get bill IDs
    let billsQuery = supabase
      .from('bills')
      .select('id, bill_date, connections!inner(site_id, account_number, biller_list!inner(alias))')
      .eq('is_deleted', false);

    // Apply filters based on search params
    if (searchParams.bill_date_start && searchParams.bill_date_end) {
      billsQuery = billsQuery
        .gte('bill_date', searchParams.bill_date_start)
        .lte('bill_date', searchParams.bill_date_end);
    }

    if (searchParams.site_id) {
      const value = searchParams.site_id.split(',').map(v => v.trim());
      billsQuery = billsQuery.in('connections.site_id', value);
    }

    if (searchParams.account_number) {
      const value = searchParams.account_number.split(',').map(v => v.trim());
      billsQuery = billsQuery.in('connections.account_number', value);
    }

    if (searchParams.biller_id) {
      const value = searchParams.biller_id.split(',').map(v => v.trim());
      billsQuery = billsQuery.in('connections.biller_list.alias', value);
    }

    // Apply table-specific filters
    if (table === 'bills_in_batches') {
      const batchId = searchParams.batch_id || param;
      if (batchId) {
        billsQuery = billsQuery.eq('batch_id', batchId);
      }
    }

    if (table === 'postpaid_paid') {
      billsQuery = billsQuery
        .eq('payment_status', true)
        .eq('is_active', true)
        .eq('is_valid', true);
    }

    if (table === 'new_bills') {
      billsQuery = billsQuery
        .eq('bill_status', 'new')
        .eq('payment_status', false)
        .eq('is_active', true)
        .eq('is_valid', true);
    }

    if (table === 'all_bill') {
      billsQuery = billsQuery.eq('connections.is_active', true);
    }

    const { data: billsData, error: billsError } = await billsQuery;

    if (billsError || !billsData || billsData.length === 0) {
      return [];
    }

    // Extract bill IDs
    const billIds = billsData.map((bill: any) => bill.id);

    // Now query meter_readings for these bills
    const { data: meterReadingsData, error: meterReadingsError } = await supabase
      .from('meter_readings')
      .select('*')
      .in('bill_id', billIds);

    if (meterReadingsError || !meterReadingsData) {
      console.error('Error fetching meter readings:', meterReadingsError);
      return [];
    }

    // Create a map of bill_id to bill data for quick lookup
    const billMap = new Map();
    billsData.forEach((bill: any) => {
      billMap.set(bill.id, bill);
    });

    // Map the data to the required format
    const mappedData = meterReadingsData.map((reading: any) => {
      const bill = billMap.get(reading.bill_id);
      // Handle both array and single object cases for connections
      const connection = Array.isArray(bill?.connections) 
        ? bill.connections[0] 
        : bill?.connections;
      
      return {
        'Bill Date': bill?.bill_date || '',
        'Site Id': connection?.site_id || '',
        'Account Number': connection?.account_number || '',
        'Meter No': reading.meter_no || '',
        'Type': reading.type || '',
        'Start Reading': reading.start_reading || '',
        'Start Date': reading.start_date || '',
        'End Reading': reading.end_reading || '',
        'End Date': reading.end_date || '',
        'Multiplication Factor': reading.multiplication_factor || ''
      };
    });

    return mappedData;
  } catch (error) {
    console.error('Error in fetchMeterReadingsForBills:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const referer = request?.headers.get('referer') || '';
  const param = referer.split('/').slice(-1)[0].split("?")[0]
  const searchParams = getParams(referer);
  console.log(table)
  try {
    let fetchData: any = [];
    let fetchError = null;
    if (table === 'registration_failed') {
      const filterBody = searchParams?.filter
        ? JSON?.parse(searchParams?.filter)
        : {};
      const { export_data, error } = await fetchRegistrations(filterBody, {
        is_export: true
      });
      fetchData = export_data || [];
      fetchError = error;
    } else if (table === 'all_bill') {
      const { export_data, error } = await fetchAllBills(searchParams, {
        is_export: true
      });
      fetchData = export_data || [];
      fetchError = error;
    } else if (table === 'payment_update') {
      const { export_data, error } = await fetchPaymentEdit(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'recharge_payment_update') {
      const { export_data, error } = await fetchRechargePaymentEdit(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'postpaid_connections') {
      const { export_data, error } = await fetchAllConnections(searchParams, {
        is_export: true,
        pay_type: 1
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'prepaid_connections') {
      const { export_data, error } = await fetchAllConnections(searchParams, {
        is_export: true,
        pay_type: 0
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'submeter_connections') {
      const { export_data, error } = await fetchAllConnections(searchParams, {
        is_export: true,
        pay_type: -1
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'site') {
      const { export_data, error } = await fetchAllSites(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'lag_sites') {
      const { export_data, error } = await fetchLagSites(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'not_fetch_bills') {
      const { export_data, error } = await fetchNotFetchBills(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'postpaid_paid') {
      const { export_data, error } = await fetchPostpaidPaid(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'prepaid_paid') {
      const { export_data, error } = await fetchPrepaidPaid(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    }
    else if (table === 'new_bills') {
      const { export_data, error } = await fetchNewBills(searchParams, {
        is_export: true
      });
      fetchData = export_data || [];
      fetchError = error;
    }
    else if (table === 'registration_report') {
      const { export_data, error } = await fetchRegistrationReport(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'bill_report') {
      const { export_data, error } = await fetchBillHistoryReport(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'payment_report') {
      const { export_data, error } = await fetchPaymentHistoryReport(searchParams, {
        is_export: true
      }
      );
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'prepaid_balance_lag') {
      const { export_data, error } = await fetchPrepaidBalanceLag(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'failure_report') {
      const filterBody = searchParams?.filter
        ? JSON?.parse(searchParams?.filter)
        : {};
      const { export_data, error } = await fetchFailureReport(filterBody, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    }
    else if (table === 'recharge_report') {
      const { export_data, error } = await fetchRechargeReport(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'wallet_transactions') {
      const { export_data, error } = await fetchClientWallet(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    }
    else if (table === 'submeter_readings') {
      const { export_data, error } = await fetchSubmeterReadings(searchParams, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'batch_items') {
      const { data, error } = await fetchBatchItems(param);
      fetchData = data;
      fetchError = error;
    } else if (table === 'bills_in_batches') {
      const filterBody = searchParams?.postpaid ? JSON?.parse(searchParams?.postpaid) : {}
      const { export_data, error } = await fetchBillsInBatches({ ...filterBody, batch_id: param }, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'recharges_in_batches') {
      const filterBody = searchParams?.prepaid ? JSON?.parse(searchParams?.prepaid) : {}
      const { export_data, error } = await fetchRechargesInBatches({ ...filterBody, batch_id: param }, {
        is_export: true
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'portal_statement') {
      const { export_data, error } = await fetchClientWallet(searchParams, {
        is_export: true,
        side: 'portal'
      });
      fetchData = export_data;
      fetchError = error;
    } else if (table === 'support_statement') {
      const { export_data, error } = await fetchClientWallet(searchParams, {
        is_export: true,
        side: 'support'
      });
      fetchData = export_data;
      fetchError = error;
    }

    if (fetchError) throw fetchError;

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(fetchData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, table);

    // For bill-related exports, add meter readings sheet
    const billExportTables = ['all_bill', 'new_bills', 'bills_in_batches', 'postpaid_paid', 'bill_report'];
    if (billExportTables.includes(table)) {
      const meterReadingsData = await fetchMeterReadingsForBills(searchParams, table, param);
      console.log(meterReadingsData)
      if (meterReadingsData.length > 0) {
        const meterReadingsWorksheet = XLSX.utils.json_to_sheet(meterReadingsData);
        XLSX.utils.book_append_sheet(workbook, meterReadingsWorksheet, 'Meter Readings');
      }
    }

    // Convert workbook to a binary string
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer'
    });

    // Set headers for file download
    const headers = new Headers();
    headers.append(
      'Content-Disposition',
      `attachment; filename=${table}_export.xlsx`
    );
    headers.append(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    headers.append('X-Content-Type-Options', 'nosniff');
    headers.append('X-Frame-Options', 'DENY');
    headers.append('X-XSS-Protection', '1; mode=block');

    // Return the Excel file as a response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
