import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { BillerListProps } from '@/types/biller-list-type';
import { handleDatabaseError } from '@/lib/utils/supabase-error';

export const fetchBillers = cache(async () => {
  const supabase = createClient();
  const { data: biller_list, error } = await supabase
    .from('biller_list')
    .select('*');
  if (error) {
    const handledError = handleDatabaseError(error);
    console.error('Error fetching billers:', handledError.message);
    return null;
  } else {
    return biller_list as BillerListProps[];
  }
});
