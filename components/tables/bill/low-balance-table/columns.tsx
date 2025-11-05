'use client';
import { ColumnDef } from '@tanstack/react-table';
import { LowBalanceConnectionTableProps } from '@/types/connections-type';
import { formatRupees } from '@/lib/utils/number-format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@/lib/utils/site';
import { SiteAccountBoardCell } from '@/components/table-cells/site-account-board-cell';
export const columns: ColumnDef<LowBalanceConnectionTableProps>[] = [

  {
    id: 'id',
    header: () => useSiteName(),
    cell: ({ row }) => <SiteAccountBoardCell row={row} />
  },
  {
    header: 'Balance',
    cell: ({ row }) => formatRupees(row.original.balance_amount)
  },
  {
    header: 'Action',
    cell: ({ row }) => {

      const router = useRouter()
      const currentStatus = row.original.current_status;
      const { toast } = useToast();
      const supabase = createClient();
      const [isOpen, setIsOpen] = useState(false);
      const [amount, setAmount] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [amountError, setAmountError] = useState('');
      const [rechargeDate, setRechargeDate] = useState<Date | null>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      });
      const validateAmount = (value: string) => {
        const numAmount = Number(value);
        if (!value) {
          setAmountError('Amount is required');
          return false;
        }
        if (numAmount < 100) {
          setAmountError('Minimum recharge amount is ₹100');
          return false;
        }
        setAmountError('');
        return true;
      };

      const handleRecharge = async () => {
        if (!validateAmount(amount)) return;

        setIsLoading(true);
        try {
          const { error } = await supabase.from('prepaid_recharge').insert({
            connection_id: row.original.id,
            recharge_amount: amount,
            recharge_date: rechargeDate?.toISOString().split('T')[0],
            recharge_status: 'approved'
          });

          if (error) throw error;

          toast({
            title: 'Recharge Requested 🎉',
            description: `Your account will be recharged with ₹${amount} on ${rechargeDate?.toISOString().split('T')[0]}`,
            variant: 'success'
          });
          setIsOpen(false);
        } catch (error) {
          console.error('Error updating balance:', error);
          toast({
            title: 'Recharge Failed',
            description: 'There was an error processing your recharge. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
          router.refresh()
        }
      };

      return (
        <div>
          <Button variant={currentStatus === true ? 'outline' : 'default'} disabled={currentStatus === true} onClick={() => setIsOpen(true)} size="sm" >
            Recharge Now
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">Recharge Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Recharge Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount (min. ₹100)"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        validateAmount(e.target.value);
                      }}
                      className={`pl-8 ${amountError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {amountError && (
                    <p className="text-sm text-red-500 mt-1">{amountError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Recharge Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={rechargeDate ? rechargeDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setRechargeDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecharge}
                    disabled={isLoading || !amount || Boolean(amountError)}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Confirm Recharge'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
  }
];
