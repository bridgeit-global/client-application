import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BillerListProps } from '@/types/biller-list-type';
import { useAsyncOperation } from './use-supabase-error';

export function useBiller() {
    const { loading, error, data: billers, execute, clearError } = useAsyncOperation<BillerListProps[]>();

    useEffect(() => {
        execute(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('biller_list')
                .select('*')
                .order('board_name', { ascending: true });

            if (error) throw error;
            return data || [];
        });
    }, [execute]);

    return { billers, loading, error, clearError };
}
