import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleDatabaseError } from '@/lib/utils/supabase-error';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    try {
        const body = await req.json();
        const { batchId, transactionReference, paymentMode, remarks, amount, transactionDate } = body;
        const batch_status = body?.batch_status
        const transaction_pay_type = body?.transaction_pay_type || 'batch';
        if (!batchId || !transactionReference || !paymentMode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { data: bill_data, error: bill_error } = await supabase
            .from('bills')
            .select('approved_amount')
            .eq('payment_status', false)
            .eq('batch_id', batchId)
        if (bill_error) {
            const handledError = handleDatabaseError(bill_error);
            throw new Error(handledError.message);
        }
        const { data: recharge_data, error: recharge_error } = await supabase
            .from('prepaid_recharge')
            .select('recharge_amount')
            .eq('batch_id', batchId)
        if (recharge_error) {
            const handledError = handleDatabaseError(recharge_error);
            throw new Error(handledError.message);
        }


        const totalBillAmount = bill_data?.reduce((acc, curr) => acc + curr.approved_amount, 0);
        const totalRechargeAmount = recharge_data?.reduce((acc, curr) => acc + curr.recharge_amount, 0);
        const totalAmount = totalBillAmount + totalRechargeAmount;
        // Insert into payment_gateway_transactions
        const { error: txnError } = await supabase.from('payment_gateway_transactions').insert({
            batch_id: batchId,
            transaction_reference: transactionReference,
            amount: amount || totalAmount,
            transaction_date: transactionDate || new Date().toISOString().slice(0, 10), // YYYY-MM-DD
            payment_method: paymentMode,
            payment_status: 'pending',
            transaction_pay_type: transaction_pay_type,
            payment_remarks: remarks || null,
            created_by: user?.id || null
        });
        if (txnError) {
            const handledError = handleDatabaseError(txnError);
            throw new Error(handledError.message);
        }

        // Update bills or prepaid_recharge
        let updateError;
        if (totalBillAmount > 0 && batch_status === 'processing') {
            const { error } = await supabase.from('bills').update({
                bill_status: 'payment'
            }).eq('batch_id', batchId);
            updateError = error;
        }
        if (totalRechargeAmount > 0 && batch_status === 'processing') {
            const { error } = await supabase.from('prepaid_recharge').update({
                recharge_status: 'payment'
            }).eq('batch_id', batchId);
            updateError = error;
        }
        if (updateError) {
            const handledError = handleDatabaseError(updateError);
            throw new Error(handledError.message);
        }

        // Update batch status
        if (batch_status) {
            const { error: batchError } = await supabase.from('batches').update({
                batch_status: batch_status,
                updated_by: user?.id || null
            }).eq('batch_id', batchId);
            if (batchError) {
                const handledError = handleDatabaseError(batchError);
                throw new Error(handledError.message);
            }
        }
        return NextResponse.json({ success: true, message: 'Payment processed successfully' });
    } catch (error: any) {
        console.error('Unexpected error in batch payment:', error);
        const handledError = handleDatabaseError(error);
        return NextResponse.json({ error: handledError.message || 'An unexpected error occurred. Please try again or contact support.' }, { status: 500 });
    }
}
