/**
 * Bump unpaid-batch audit fields so the batches webhook can re-run Batch Advice
 * after items are linked — without writing URL columns (those are edge-owned and
 * must not re-enter the email path).
 *
 * Do not use this to fake a batch_status transition. See
 * `.cursor/rules/batch-webhook-triggers.mdc`.
 */
export async function touchBatchForAdvice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any },
  batchId: string,
  updatedBy: string | null
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase
    .from('batches')
    .update({
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    })
    .eq('batch_id', batchId)
    .eq('batch_status', 'unpaid');

  return { error };
}
