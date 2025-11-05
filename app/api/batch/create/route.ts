import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body?.data) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('user', user);
      const { data, batchName, validate_at } = body;
      const recharge_ids = data.filter((e: any) => e.paytype === 0).map((e: any) => e.id);
      const bill_ids = data.filter((e: any) => e.paytype !== 0).map((e: any) => e.id);

      const { data: batch_data, error: batch_error } = await supabase
        .from('batches')
        .insert([{ 
          batch_name: batchName || null, 
          validate_at: validate_at || null, 
          created_by: user?.id || null
        }])
        .select().single();
      console.log('batch_data', batch_data);
      console.log('batch_error', batch_error);
      if (batch_error) {
        const handledError = handleDatabaseError(batch_error);
        throw handledError.message;
      }
      if (batch_data && batch_data?.batch_id) {
        const { error: bill_error } = await supabase
          .from('bills')
          .update({ batch_id: batch_data?.batch_id, bill_status: 'batch' })
          .in('id', bill_ids);
        console.log('bill_error', bill_error);
        const { error: recharge_error } = await supabase
          .from('prepaid_recharge')
          .update({ batch_id: batch_data?.batch_id, recharge_status: 'batch' })
          .in('id', recharge_ids);
        console.log('recharge_error', recharge_error);
        if (bill_error) {
          const handledError = handleDatabaseError(bill_error);
          throw handledError.message;
        }
        if (recharge_error) {
          const handledError = handleDatabaseError(recharge_error);
          throw handledError.message;
        }
      }

      return NextResponse.json({
        message: 'Batch created successfully',
        batch_id: batch_data?.batch_id ?? null
      });


    } catch (error) {
      return NextResponse.json({ message: error }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'No record found' }, { status: 400 });
  }
}
