import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchSubmeterConnectionsBySite, fetchBillReadings } from '@/services/submeter-bill';
import { logAndHandleDatabaseError } from '@/lib/utils/supabase-error';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('site_id');

  if (!siteId) {
    return NextResponse.json(
      { error: 'site_id query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await fetchSubmeterConnectionsBySite(siteId);

    if (error) {
      const handled = logAndHandleDatabaseError(error, 'read');
      return NextResponse.json({ error: handled.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch submeter connections' },
      { status: 500 }
    );
  }
}

type PostBody = {
  connection_id?: string;
  billing_start?: string;
  billing_end?: string;
  preview?: boolean;
  content_path?: string;
};

function buildInvoicePayload(
  connection: any,
  startReading: any,
  endReading: any,
  billing_start: string,
  billing_end: string
) {
  const unitsConsumed =
    Number(endReading.end_reading) - Number(startReading.start_reading);

  const tariffValue = Number(connection.tariff) || 0;
  const billAmount = Number((unitsConsumed * tariffValue).toFixed(2));

  const siteId: string = connection.site_id;
  const accountNumber: string = String(connection.account_number);

  const endDate = new Date(billing_end);
  const y = endDate.getFullYear();
  const m = String(endDate.getMonth() + 1).padStart(2, '0');
  const billPeriodKey = `${y}${m}`;

  const billNumber = `${siteId}_${accountNumber}_${billPeriodKey}`;
  const billId = `${connection.id}_${billNumber}`;

  const dueDate = new Date(endDate);
  dueDate.setDate(dueDate.getDate() + 15);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  const submeterInfo = connection.submeter_info || {};

  const invoice = {
    bankDetails: {
      bankName: submeterInfo.bank_name ?? '',
      bankAccountNumber: submeterInfo.bank_account_number ?? '',
      bankAccountHolderName: submeterInfo.bank_account_holder_name ?? '',
      ifscCode: submeterInfo.ifsc_code ?? '',
      operatorMobileNumber: submeterInfo.operator_mobile_number
        ? String(submeterInfo.operator_mobile_number)
        : ''
    },
    consumerDetails: {
      stationId: siteId,
      operatorName: submeterInfo.operator_name ?? '',
      meterNo: accountNumber,
      tariff: connection.tariff ?? '',
      billingPeriod: `${billing_start} to ${billing_end}`,
      billNumber
    },
    billingSummary: {
      startReading: Number(startReading.start_reading),
      endReading: Number(endReading.end_reading),
      unitsConsumed,
      amountPayable: billAmount
    }
  };

  return {
    invoice,
    billId,
    billNumber,
    dueDateStr,
    unitsConsumed,
    billAmount,
    tariffValue
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PostBody;
  const { connection_id, billing_start, billing_end, preview, content_path } = body;

  if (!connection_id || !billing_start || !billing_end) {
    return NextResponse.json(
      { error: 'connection_id, billing_start and billing_end are required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select(
        `
          *,
          sites!inner(
            id,
            name
          )
        `
      )
      .eq('id', connection_id)
      .single();

    if (connectionError || !connection) {
      const handled = connectionError
        ? logAndHandleDatabaseError(connectionError, 'read')
        : { message: 'Connection not found' };

      return NextResponse.json({ error: handled.message }, { status: 404 });
    }

    const { data: readings, error: readingsError } = await fetchBillReadings({
      connection_id,
      billing_start,
      billing_end
    });

    if (readingsError) {
      const handled = logAndHandleDatabaseError(readingsError, 'read');
      return NextResponse.json({ error: handled.message }, { status: 500 });
    }

    const { startReading, endReading } = readings;

    if (!startReading || !endReading) {
      return NextResponse.json(
        { error: 'Start or end reading not found for the given period' },
        { status: 400 }
      );
    }

    const endDate = new Date(billing_end);
    if (Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'billing_end must be a valid date (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const {
      invoice,
      billId,
      billNumber,
      dueDateStr,
      unitsConsumed,
      billAmount,
      tariffValue
    } = buildInvoicePayload(connection, startReading, endReading, billing_start, billing_end);

    if (unitsConsumed < 0) {
      return NextResponse.json(
        { error: 'End reading must be greater than or equal to start reading' },
        { status: 400 }
      );
    }

    // Preview mode: return invoice data without saving to DB
    if (preview) {
      return NextResponse.json(
        { invoice, billNumber },
        { status: 200 }
      );
    }

    // Save mode: insert bill into DB
    const billInsert = {
      id: billId,
      connection_id,
      bill_number: billNumber,
      bill_type: 'Normal',
      bill_status: 'new',
      bill_date: billing_end,
      start_date: billing_start,
      end_date: billing_end,
      billed_unit: unitsConsumed,
      bill_amount: billAmount,
      unit_cost: tariffValue,
      due_date: dueDateStr,
      content: content_path || 'Auto Generated',
      content_type: content_path ? 'pdf' : 'plain/text',
      is_active: true,
      is_valid: true,
      payment_status: false,
      penalty_amount: 0,
      due_date_rebate: 0
    };

    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([billInsert])
      .select()
      .single();

    if (billError) {
      const handled = logAndHandleDatabaseError(billError, 'add');
      return NextResponse.json({ error: handled.message }, { status: 500 });
    }

    const charges = { id: billId };
    await supabase.from('core_charges').insert([charges]).select();
    await supabase.from('additional_charges').insert([charges]).select();
    await supabase.from('adherence_charges').insert([charges]).select();
    await supabase.from('regulatory_charges').insert([charges]).select();

    return NextResponse.json(
      {
        bill: billData,
        invoice
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate submeter bill' },
      { status: 500 }
    );
  }
}

