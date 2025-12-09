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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { batchId, billIds = [], rechargeIds = [] } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    if (billIds.length === 0 && rechargeIds.length === 0) {
      return NextResponse.json({ error: 'No items to add to batch' }, { status: 400 });
    }
    console.log('billIds', billIds);
    console.log('rechargeIds', rechargeIds);

    // Update batch metadata
    const { error: batchUpdateError } = await supabase
      .from('batches')
      .update({
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);

    console.log('batchUpdateError', batchUpdateError);

    if (batchUpdateError) {
      const handledError = handleDatabaseError(batchUpdateError);
      return NextResponse.json({ error: `Failed to update batch: ${handledError.message}` }, { status: 500 });
    }

    // Update bills in chunks
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
        return NextResponse.json({ error: `Failed to add bills: ${handledError.message}` }, { status: 500 });
      }
    }

    // Update recharges in chunks
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
        return NextResponse.json({ error: `Failed to add recharges: ${handledError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Items added to batch successfully',
      batchId,
      billsAdded: billIds.length,
      rechargesAdded: rechargeIds.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error adding items to batch:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

