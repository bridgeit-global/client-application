import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';
import { touchBatchForAdvice } from '@/lib/batch/touch-batch-for-advice';
import { NextRequest, NextResponse } from 'next/server';

// Chunk size for processing updates to avoid timeouts
const CHUNK_SIZE = 5;

/**
 * Process updates in chunks to avoid database timeouts
 */
async function updateInChunks<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  ids: T[],
  updateData: Record<string, unknown>,
  idField: string = 'id'
): Promise<{ error: unknown }> {
  if (ids.length === 0) {
    return { error: null };
  }

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
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      batchId,
      billIds = [],
      rechargeIds = [],
      validateAt
    }: {
      batchId?: string;
      billIds?: string[];
      rechargeIds?: string[];
      validateAt?: string | null;
    } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    if (billIds.length === 0 && rechargeIds.length === 0) {
      return NextResponse.json({ error: 'No items to add to batch' }, { status: 400 });
    }

    const { data: batch, error: batchLookupError } = await supabase
      .from('batches')
      .select('batch_id, batch_status, validate_at')
      .eq('batch_id', batchId)
      .maybeSingle();

    if (batchLookupError) {
      const handledError = handleDatabaseError(batchLookupError);
      return NextResponse.json({ error: handledError.message }, { status: 500 });
    }
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (batch.batch_status !== 'unpaid') {
      return NextResponse.json(
        { error: 'Items can only be added to unpaid batches' },
        { status: 400 }
      );
    }

    console.log('billIds', billIds);
    console.log('rechargeIds', rechargeIds);

    // Link items first, then touch the batch. Updating the batch before
    // items are linked races the batch-updates → batch-create webhook and
    // can skip Batch Advice (empty after retries). Same pattern as create.
    // Never write batch_*_url from the app — edge functions own those and
    // a URL write-back must not re-enter the email path.
    if (billIds.length > 0) {
      const { error: billError } = await updateInChunks(
        supabase,
        'bills',
        billIds,
        { batch_id: batchId, bill_status: 'batch' },
        'id'
      );

      if (billError) {
        console.log('billError', billError);
        const handledError = handleDatabaseError(billError);
        return NextResponse.json(
          { error: `Failed to add bills: ${handledError.message}` },
          { status: 500 }
        );
      }
    }

    if (rechargeIds.length > 0) {
      const { error: rechargeError } = await updateInChunks(
        supabase,
        'prepaid_recharge',
        rechargeIds,
        { batch_id: batchId, recharge_status: 'batch' },
        'id'
      );

      if (rechargeError) {
        console.log('rechargeError', rechargeError);
        const handledError = handleDatabaseError(rechargeError);
        return NextResponse.json(
          { error: `Failed to add recharges: ${handledError.message}` },
          { status: 500 }
        );
      }
    }

    // Optional validate_at bump (from batch-detail add buttons). Apply after
    // link so advice sees the new items; non-URL fields only.
    if (validateAt) {
      const { error: validateError } = await supabase
        .from('batches')
        .update({
          validate_at: validateAt,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('batch_id', batchId)
        .eq('batch_status', 'unpaid');

      if (validateError) {
        const handledError = handleDatabaseError(validateError);
        return NextResponse.json(
          { error: `Failed to update batch validation date: ${handledError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Touch after link so unpaid advice webhook sees bills/recharges.
      const { error: batchUpdateError } = await touchBatchForAdvice(
        supabase,
        batchId,
        user?.id || null
      );

      console.log('batchUpdateError', batchUpdateError);

      if (batchUpdateError) {
        const handledError = handleDatabaseError(batchUpdateError);
        return NextResponse.json(
          { error: `Failed to update batch: ${handledError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Items added to batch successfully',
        batchId,
        billsAdded: billIds.length,
        rechargesAdded: rechargeIds.length
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error adding items to batch:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
