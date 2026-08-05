import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';
import { NextRequest, NextResponse } from 'next/server';

// Chunk size for processing updates to avoid timeouts
const CHUNK_SIZE = 5;

/**
 * Process updates in chunks to avoid database timeouts
 */
async function updateInChunks<T>(
  supabase: any,
  table: string,
  ids: T[],
  updateData: Record<string, any>,
  idField: string = 'id'
): Promise<{ error: any }> {
  if (ids.length === 0) {
    return { error: null };
  }

  // Process in chunks
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from(table)
      .update(updateData)
      .in(idField, chunk);

    if (error) {
      return { error };
    }
  }

  return { error: null };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body?.data) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('user', user);
      const { data, batchName, validate_at } = body;
      // Prefer explicit kind from the cart. Falling back to paytype alone
      // mis-routes prepaid_recharge rows that sit on paytype≠0 connections
      // into the bills update path (empty batch).
      const recharge_ids = data
        .filter(
          (e: { kind?: string; paytype?: number }) =>
            e.kind === 'recharge' || (e.kind == null && e.paytype === 0)
        )
        .map((e: { id: string }) => e.id);
      const bill_ids = data
        .filter(
          (e: { kind?: string; paytype?: number }) =>
            e.kind === 'bill' ||
            (e.kind == null && e.paytype !== 0)
        )
        .map((e: { id: string }) => e.id);

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
        // Update bills in chunks of 5
        if (bill_ids.length > 0) {
          const { error: bill_error } = await updateInChunks(
            supabase,
            'bills',
            bill_ids,
            { batch_id: batch_data?.batch_id, bill_status: 'batch' },
            'id'
          );
          console.log('bill_error', bill_error);
          if (bill_error) {
            const handledError = handleDatabaseError(bill_error);
            throw handledError.message;
          }
        }

        // Update recharges in chunks of 5
        if (recharge_ids.length > 0) {
          const { error: recharge_error } = await updateInChunks(
            supabase,
            'prepaid_recharge',
            recharge_ids,
            { batch_id: batch_data?.batch_id, recharge_status: 'batch' },
            'id'
          );
          console.log('recharge_error', recharge_error);
          if (recharge_error) {
            const handledError = handleDatabaseError(recharge_error);
            throw handledError.message;
          }
        }

        // Touch the batch after items are linked so the batch-updates webhook
        // re-runs advice generation with bills/recharges present. The insert
        // webhook can fire on an empty batch; this update is the supported
        // path for a non-empty advice email (empty send is blocked server-side).
        if (bill_ids.length > 0 || recharge_ids.length > 0) {
          const { error: touch_error } = await supabase
            .from('batches')
            .update({
              updated_by: user?.id || null,
              updated_at: new Date().toISOString()
            })
            .eq('batch_id', batch_data.batch_id);

          console.log('touch_error', touch_error);
          if (touch_error) {
            const handledError = handleDatabaseError(touch_error);
            throw handledError.message;
          }
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
