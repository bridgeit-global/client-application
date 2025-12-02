import WalletTable from '@/components/tables/payment/wallet-table';
import { createClient } from '@/lib/supabase/server';
import { fetchClientWallet } from '@/services/payments';
import { SearchParamsProps } from '@/types';

export default async function Page(
  props: {
    searchParams: Promise<SearchParamsProps>;
  }
) {
  const searchParams = await props.searchParams;
  const { data, totalCount, pageCount, summary } = await fetchClientWallet(searchParams);
  const supabase = await createClient();
  const { data: amountData } = await supabase.rpc('is_approved_amount_within_threshold').select().single();
  return (
    <WalletTable
      side='portal'
      pendingAmount={(amountData as { pending_amount?: number })?.pending_amount ?? 0}
      summary={summary ?? {
        credits: 0,
        debits: 0,
        balance: 0,
        count: 0,
      }}
      transactions={data}
      totalCount={totalCount}
      pageCount={pageCount}
      searchParams={searchParams}
    />
  );
}
