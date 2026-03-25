'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ddmmyy } from '@/lib/utils/date-format';
import { formatRupees } from '@/lib/utils/number-format';
import { getPrepaidBalance } from '@/lib/utils';
import { getLatestBill, getLatestRecharge } from '@/lib/utils/bill';
import { getStorageSourceFromPaytype } from '@/lib/utils/presigned-url-client';
import {
  connectionPayloadForTimeline,
  convertConnectionToTimelineEvents
} from '@/lib/utils/connection-profile-timeline';
import type { Connection } from '@/types/site-type';
import type { PrepaidBalanceProps } from '@/types/prepaid-balance-type';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import StatusBadge from '@/components/badges/status-badge';
import { LowBalanceBadge } from '@/components/badges/low-balance-badge';
import IsActiveBadge from '@/components/badges/is-active-badge';
import { BillTable } from '@/components/tables/bill-table';
import { PaymentTable } from '@/components/tables/payment-table';
import { PrepaidRechargeTable } from '@/components/tables/prepaid-recharge-table';
import PrepaidBalancesChart from '@/app/portal/profile/prepaid-balances-chart';
import { SubmeterReadingsDashboard } from '@/components/meter-dashboard/submeter-readings-dashboard';
import { Timeline } from '@/app/portal/profile/timeline';
import { AlertModal } from '@/components/modal/alert-modal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/lib/store/user-store';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

export type ConnectionProfileBodyProps = {
  connection: Connection;
  siteLabel: string;
  siteId: string;
  siteName?: string;
  /** When false, hides edit/delete/switch (e.g. read-only preview). */
  showActions?: boolean;
  onMutate?: () => void;
};

export function ConnectionProfileBody({
  connection,
  siteLabel,
  siteId,
  siteName,
  showActions = true,
  onMutate
}: ConnectionProfileBodyProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserStore();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [postpaidMoreOpen, setPostpaidMoreOpen] = useState(false);

  const payments = connection.payments ?? [];
  const submeterData = connection.submeter_readings ?? [];

  const timelinePayload = connectionPayloadForTimeline(
    connection.bills,
    payments
  );
  const events = convertConnectionToTimelineEvents(
    timelinePayload,
    submeterData
  );

  const latestBill = getLatestBill(connection.bills);
  const latestRecharge = getLatestRecharge(connection.prepaid_recharge);
  const latestPrepaidBalance = getPrepaidBalance(connection.prepaid_balances);
  const prepaid_info = connection.prepaid_info;
  const isLowBalance =
    prepaid_info &&
    latestPrepaidBalance?.balance_amount != null &&
    latestPrepaidBalance.balance_amount < prepaid_info.threshold_amount;

  const defaultDetailTab = (() => {
    if (connection.bills?.length) return 'bills';
    if (payments.length) return 'payments';
    if (connection.prepaid_recharge?.length) return 'recharges';
    if (connection.paytype === 0 && connection.prepaid_balances?.length)
      return 'balances';
    if (connection.paytype === -1 && submeterData.length > 0)
      return 'submeter';
    if (events.length) return 'timeline';
    return '';
  })();

  const toggleConnectionStatus = async (checked: boolean): Promise<boolean> => {
    try {
      const { data: updateResp, error } = await supabase
        .from('connections')
        .update({ is_active: checked, updated_by: user?.id })
        .eq('id', connection.id)
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${checked ? 'activate' : 'deactivate'} connection. ${error.message}`
        });
        return false;
      }
      if (!updateResp?.length) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to ${checked ? 'activate' : 'deactivate'} connection. No data updated.`
        });
        return false;
      }
      toast({
        variant: 'success',
        title: 'Success',
        description: `Successfully ${checked ? 'activated' : 'deactivated'} connection`
      });
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
      return false;
    }
  };

  const deleteConnection = async (): Promise<boolean> => {
    try {
      const { data: updateResp, error } = await supabase
        .from('connections')
        .update({ is_deleted: true, updated_by: user?.id })
        .eq('id', connection.id)
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to delete connection. ${error.message}`
        });
        return false;
      }
      if (!updateResp?.length) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete connection. No data updated.'
        });
        return false;
      }
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Successfully deleted connection'
      });
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while deleting'
      });
      return false;
    }
  };

  const accountLabel =
    connection.paytype === -1 ? 'Meter No.' : 'Account';

  const hasPostpaidHeavy =
    connection.paytype === 1 &&
    ((connection.bills && connection.bills.length > 0) ||
      payments.length > 0 ||
      events.length > 0);

  const renderDetailTabs = () => {
    const hasBills = !!(connection.bills && connection.bills.length > 0);
    const hasPayments = payments.length > 0;
    const hasRecharges = !!(
      connection.prepaid_recharge && connection.prepaid_recharge.length > 0
    );
    const hasBalances =
      connection.paytype === 0 &&
      !!(connection.prepaid_balances && connection.prepaid_balances.length > 0);
    const hasSubmeter =
      connection.paytype === -1 && submeterData.length > 0;
    const hasTimeline = events.length > 0;
    const anyTab =
      hasBills ||
      hasPayments ||
      hasRecharges ||
      hasBalances ||
      hasSubmeter ||
      hasTimeline;
    if (!anyTab) {
      return (
        <p className="text-sm text-muted-foreground">
          No detailed records to display yet.
        </p>
      );
    }
    const pickDefault =
      (hasBills && defaultDetailTab === 'bills') ||
      (hasPayments && defaultDetailTab === 'payments') ||
      (hasRecharges && defaultDetailTab === 'recharges') ||
      (hasBalances && defaultDetailTab === 'balances') ||
      (hasSubmeter && defaultDetailTab === 'submeter') ||
      (hasTimeline && defaultDetailTab === 'timeline');
    const firstTab = pickDefault
      ? defaultDetailTab
      : hasBills
        ? 'bills'
        : hasPayments
          ? 'payments'
          : hasRecharges
            ? 'recharges'
            : hasBalances
              ? 'balances'
              : hasSubmeter
                ? 'submeter'
                : 'timeline';

    return (
    <Tabs defaultValue={firstTab} className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
        {hasBills ? (
          <TabsTrigger value="bills">Bills</TabsTrigger>
        ) : null}
        {hasPayments ? (
          <TabsTrigger value="payments">Payments</TabsTrigger>
        ) : null}
        {hasRecharges ? (
          <TabsTrigger value="recharges">Recharges</TabsTrigger>
        ) : null}
        {hasBalances ? (
          <TabsTrigger value="balances">Balances</TabsTrigger>
        ) : null}
        {hasSubmeter ? (
          <TabsTrigger value="submeter">Submeter</TabsTrigger>
        ) : null}
        {hasTimeline ? (
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        ) : null}
      </TabsList>

      {hasBills ? (
        <TabsContent value="bills" className="mt-4">
          <BillTable data={connection.bills} />
        </TabsContent>
      ) : null}
      {hasPayments ? (
        <TabsContent value="payments" className="mt-4">
          <PaymentTable data={payments} />
        </TabsContent>
      ) : null}
      {hasRecharges ? (
        <TabsContent value="recharges" className="mt-4">
          <PrepaidRechargeTable data={connection.prepaid_recharge!} />
        </TabsContent>
      ) : null}
      {hasBalances ? (
        <TabsContent value="balances" className="mt-4">
          <Card>
            <Tabs defaultValue="graph" className="w-full">
              <TabsList className="m-4">
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="tabular">Table</TabsTrigger>
              </TabsList>
              <TabsContent value="graph">
                <PrepaidBalancesChart
                  prepaid_balances={connection.prepaid_balances}
                  connectionId={connection.id}
                />
              </TabsContent>
              <TabsContent value="tabular">
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    Latest balances
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fetch date</TableHead>
                        <TableHead>Balance (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connection.prepaid_balances.map(
                        (row: PrepaidBalanceProps, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{ddmmyy(row.fetch_date)}</TableCell>
                            <TableCell>{formatRupees(row.balance_amount)}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>
      ) : null}
      {hasSubmeter ? (
        <TabsContent value="submeter" className="mt-4">
          <SubmeterReadingsDashboard data={submeterData} />
        </TabsContent>
      ) : null}
      {hasTimeline ? (
        <TabsContent value="timeline" className="mt-4">
          <Timeline
            location="Activity timeline"
            events={events}
            storageSource={getStorageSourceFromPaytype(connection.paytype)}
          />
        </TabsContent>
      ) : null}
    </Tabs>
    );
  };

  return (
    <>
      <AlertModal
        title="Delete this connection?"
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            const ok = await deleteConnection();
            if (ok) {
              setDeleteOpen(false);
              onMutate?.();
              router.refresh();
            }
          });
        }}
        loading={isPending}
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {connection.account_number}
              </span>
              <PayTypeBadge paytype={connection.paytype} />
              <IsActiveBadge isActive={connection.is_active} />
              {latestBill?.bill_status && connection.paytype === 1 ? (
                <StatusBadge status={latestBill.bill_status} />
              ) : null}
              {latestRecharge?.recharge_status && connection.paytype === 0 ? (
                <StatusBadge status={latestRecharge.recharge_status} />
              ) : null}
              {connection.paytype === 0 && isLowBalance && !latestRecharge?.recharge_status ? (
                <Badge variant="destructive">Low Balance</Badge>
              ) : null}
            </div>
            {showActions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Switch
                  checked={connection.is_active}
                  onCheckedChange={(checked) => {
                    startTransition(async () => {
                      const ok = await toggleConnectionStatus(checked);
                      if (ok) {
                        onMutate?.();
                        router.refresh();
                      }
                    });
                  }}
                  disabled={isPending}
                  aria-label="Toggle connection active"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2"
                  onClick={() =>
                    router.push(`/portal/connection-edit?id=${connection.id}`)
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-destructive/50 px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
          {connection.biller_list?.board_name ? (
            <p className="truncate text-sm text-muted-foreground">
              {connection.biller_list.board_name}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6 border-t border-border pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                {accountLabel}
              </span>
              <p className="font-medium text-foreground">
                {connection.account_number}
              </p>
            </div>
            {connection.name ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Name</span>
                <p className="font-medium text-foreground">{connection.name}</p>
              </div>
            ) : null}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">{siteLabel}</span>
              <p className="font-medium text-foreground">
                {siteName ?? siteId}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{siteId}</p>
            </div>
            {connection.biller_list?.board_name ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Biller board
                </span>
                <p className="font-medium text-foreground">
                  {connection.biller_list.board_name}
                </p>
              </div>
            ) : null}
            {connection.address ? (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-sm text-muted-foreground">Address</span>
                <p className="font-medium text-foreground">
                  {connection.address}
                </p>
              </div>
            ) : null}
            {connection.connection_date ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Connection date
                </span>
                <p className="font-medium text-foreground">
                  {ddmmyy(connection.connection_date)}
                </p>
              </div>
            ) : null}
            {Number(connection.security_deposit) > 0 ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Security deposit
                </span>
                <p className="font-medium text-foreground">
                  {formatRupees(connection.security_deposit)}
                </p>
              </div>
            ) : null}
            {connection.tariff ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Tariff</span>
                <p className="font-medium text-foreground">
                  {connection.tariff}
                </p>
              </div>
            ) : null}
            {connection.paytype === 0 &&
            connection.prepaid_balances &&
            connection.prepaid_balances.length > 0 ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Current balance
                </span>
                <LowBalanceBadge
                  row={{
                    original: {
                      connections: {
                        prepaid_balances: connection.prepaid_balances,
                        prepaid_info: connection.prepaid_info
                      }
                    }
                  }}
                />
              </div>
            ) : null}
          </div>

          {connection.paytype === 1 && hasPostpaidHeavy ? (
            <Collapsible open={postpaidMoreOpen} onOpenChange={setPostpaidMoreOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  type="button"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      postpaidMoreOpen && 'rotate-180'
                    )}
                  />
                  {postpaidMoreOpen ? 'Show less' : 'View more'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {renderDetailTabs()}
              </CollapsibleContent>
            </Collapsible>
          ) : connection.paytype !== 1 ? (
            defaultDetailTab ? (
              renderDetailTabs()
            ) : (
              <p className="text-sm text-muted-foreground">
                No bills, payments, recharges, or timeline data for this
                connection yet.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              No bills or payments to show yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
