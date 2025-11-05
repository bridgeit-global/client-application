import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createClient } from '../supabase/client';
import { BillerListProps } from '@/types/biller-list-type';
import { handleDatabaseError } from '@/lib/utils/supabase-error';

const supabase = createClient();

type BillerState = {
  billers: BillerListProps[];
};

type BillerActions = {
  setBillers: (billers: BillerListProps[]) => void;
  fetchBillers: () => void;
};

export const useBillerBoardStore = create<BillerState & BillerActions>()(
  persist(
    (set) => ({
      billers: [],
      setBillers: (billers: BillerListProps[]) => set({ billers }),
      fetchBillers: async () => {
        const { data: biller_list, error } = await supabase
          .from('biller_list')
          .select('*');
        if (error) {
          const handledError = handleDatabaseError(error);
          console.error('Error fetching billers:', handledError.message);
        } else {
          set({ billers: biller_list as BillerListProps[] });
        }
      }
    }),
    {
      name: 'biller-store',
      storage: createJSONStorage(() => localStorage) // (optional) by default, 'localStorage' is used
    }
  )
);
