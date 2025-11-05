import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ddmmyy } from '@/lib/utils/date-format';
import { getPrepaidBalance } from '@/lib/utils';
import { formatRupees } from '@/lib/utils/number-format';
import { TimelineItemProps } from './timeline-item';
import PrepaidBalancesChart from './prepaid-balances-chart';
import { fetchSiteProfile } from '@/services/sites';
import { Timeline } from './timeline';
import { SearchParamsProps } from '@/types';
import { PrepaidBalanceProps } from '@/types/prepaid-balance-type';
import { AllBillTableProps } from '@/types/bills-type';
import { PaymentsProps } from '@/types/payments-type';
import { MeterReadingsProps } from '@/types/meter-readings-type';
import { MeterReadingsDashboard } from '@/components/meter-dashboard/meter-readings-dashboard';
import { SubmeterReadingsDashboard } from '@/components/meter-dashboard/submeter-readings-dashboard';
import { BillTable } from '@/components/tables/bill-table';
import { PaymentTable } from '@/components/tables/payment-table';
import { PrepaidRechargeTable } from '@/components/tables/prepaid-recharge-table';
import PayTypeBadge from '@/components/badges/pay-type-badge';
import { SiteIdCell } from '@/components/table-cells/site-cell';
import { Badge } from '@/components/ui/badge';
import { PrepaidRechargeTableProps } from '@/types/connections-type';
import StatusBadge from '@/components/badges/status-badge';
import { LowBalanceBadge } from '@/components/badges/low-balance-badge';
import { fetchOrganization } from '@/services/organization';
import { fetchSubmeterReadingsByConnection } from '@/services/submeter-readings';

const getLatestBill = (bills: AllBillTableProps[]): AllBillTableProps | null => {
  if (!bills || !Array.isArray(bills) || bills.length === 0) return null;
  const activeBills = bills.filter((b) => b.is_active == true && b.is_valid == true);
  return activeBills.length > 0 ? activeBills[0] : null;
};

const getLatestRecharge = (recharges: PrepaidRechargeTableProps[]): PrepaidRechargeTableProps | null => {
  if (!recharges || !Array.isArray(recharges) || recharges.length === 0) return null;
  const activeRecharges = recharges.filter((r) => r.is_active == true && r.is_deleted == false);
  if (activeRecharges.length === 0) return null;
  return activeRecharges.sort((a, b) =>
    new Date(b.recharge_date).getTime() - new Date(a.recharge_date).getTime()
  )[0];
};

function convertToEvents(data: any, submeter_readings: any[] = []): TimelineItemProps[] {
  const events: TimelineItemProps[] = [];

  // Extract readings
  if (data?.meter_readings && Array.isArray(data.meter_readings)) {
    data.meter_readings.forEach((reading: MeterReadingsProps) => {
      if (!reading) return;
      const readingDifference = (reading.end_reading || 0) - (reading.start_reading || 0);
      const relatedBill = data.bills?.find((bill: AllBillTableProps) => bill?.id === reading.bill_id);
      events.push({
        id: reading.bill_id,
        date: reading.end_date,
        title: 'Reading',
        type: reading.type,
        billed_unit: `${readingDifference.toFixed(2)}`,
        bill_type: relatedBill?.bill_type,
        description: `${reading.end_reading}`,
        link: relatedBill?.content,
        content_type: relatedBill?.content_type
      });
    });
  }

  // Extract submeter readings
  if (submeter_readings && Array.isArray(submeter_readings)) {
    submeter_readings.forEach((reading: any) => {
      if (!reading) return;
      const readingDifference = (reading.end_reading || 0) - (reading.start_reading || 0);
      events.push({
        id: `submeter-${reading.connection_id}-${reading.reading_date}`,
        date: reading.reading_date,
        title: 'Submeter Reading',
        type: 'submeter',
        billed_unit: `${readingDifference.toFixed(2)}`,
        description: `End: ${reading.end_reading}${reading.per_day_unit ? ` | Per day: ${reading.per_day_unit}` : ''}`,
        link: '',
        content_type: ''
      });
    });
  }

  // Extract bills
  if (data?.bills && Array.isArray(data.bills)) {
    data.bills.forEach((bill: AllBillTableProps) => {
      if (!bill) return;
      // Bill event
      events.push({
        id: bill.id,
        date: bill.bill_date,
        title: 'Bill',
        link: bill.content,
        content_type: bill.content_type,
        bill_type: bill.bill_type,
        description: `₹${(bill.bill_amount || 0).toFixed(2)}`
      });

      events.push({
        id: bill.id,
        date: bill.due_date,
        title: 'DueDate',
        link: bill.content,
        bill_type: bill.bill_type,
        content_type: bill.content_type,
        description: `₹${(bill.bill_amount || 0).toFixed(2)}`
      });
    });
  }

  // Extract payments
  if (data?.payments && Array.isArray(data.payments)) {
    data.payments.forEach((payment: PaymentsProps) => {
      if (!payment) return;
      events.push({
        id: payment.id,
        date: payment.collection_date,
        title: 'Payment',
        link: payment.content || '',
        content_type: payment.content_type || '',
        description: `₹${(payment.amount || 0).toFixed(2)}`
      });
    });
  }

  // Filter out events with invalid dates
  return events.filter(event => event.date);
}
type paramsProps = {
  searchParams: SearchParamsProps;
};

export default async function Page({ searchParams }: paramsProps) {
  const { site_name } = await fetchOrganization();
  const { data, error } = await fetchSiteProfile(searchParams);
  const { id } = searchParams;

  // Fetch submeter readings if this is a submeter connection
  let submeter_readings: any[] = [];
  if (data && data.paytype === -1 && id) {
    const { data: submeterData, error: submeterError } = await fetchSubmeterReadingsByConnection(id);
    if (!submeterError && submeterData) {
      submeter_readings = submeterData;
    }
  }

  // Validate required id parameter
  if (!id) {
    return (
      <div className="container mx-auto space-y-6 p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Connection ID is required to view profile.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  
  if (data && typeof data === 'object') {
    const {
      account_number,
      connection_date,
      security_deposit,
      tariff,
      name,
      address,
      bills,
      payments,
      biller_list,
      site_id,
      connection_type,
      prepaid_balances,
      paytype,
      prepaid_recharge,
      prepaid_info
    } = data;
    const latestBill = getLatestBill(bills);
    const recharges = getLatestRecharge(prepaid_recharge);
    const latestPrepaidBalance = getPrepaidBalance(prepaid_balances);
    const rawData = {
      bills: bills || [],
      payments: payments || []
    };
    const events = convertToEvents(rawData, submeter_readings);
    return (
      <div className="container mx-auto space-y-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {site_id && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {`${site_name}`}
                  </span>
                  <div>
                    <SiteIdCell row={{ original: data }} />
                  </div>
                </div>
              )}
              {account_number && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {paytype == -1 ? 'Meter No.' : 'Account Number'}
                  </span>
                  <span className="truncate font-medium">{account_number}</span>
                </div>
              )}
              {name && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">{'Name'}</span>
                  <span className="truncate font-medium">{name}</span>
                </div>
              )}
              {biller_list?.board_name && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Biller Board'}
                  </span>
                  <span className="truncate font-medium">
                    {biller_list.board_name}
                  </span>
                </div>
              )}
              {address && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Address'}
                  </span>
                  <span className="truncate font-medium">{address}</span>
                </div>
              )}
              {connection_date && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Connection Date'}
                  </span>
                  <span className="truncate font-medium">
                    {ddmmyy(connection_date)}
                  </span>
                </div>
              )}
              {Number(security_deposit) > 0 && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Security Deposit'}
                  </span>
                  <span className="truncate font-medium">
                    {formatRupees(security_deposit)}
                  </span>
                </div>
              )}
              {tariff && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Tariff'}
                  </span>
                  <span className="truncate font-medium">{tariff}</span>
                </div>
              )}
              {paytype != null && (
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {'Payment Type'}
                  </span>
                  <div> <PayTypeBadge paytype={paytype} /></div>
                </div>
              )
              }
              {latestBill?.bill_status && paytype === 1 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {'Latest Bill Status'}
                  </span>
                  <div>
                    <StatusBadge status={latestBill.bill_status} />
                  </div>
                </div>
              )}
              {recharges?.recharge_status && paytype == 0 ? (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {'Latest Recharge Status'}
                  </span>
                  <div>
                    <StatusBadge status={recharges.recharge_status} />
                  </div>
                </div>
              ) : paytype == 0 ? (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {'Latest Recharge Status'}
                  </span>
                  {
                    prepaid_info && latestPrepaidBalance?.balance_amount != null &&
                    prepaid_info?.threshold_amount != null &&
                    latestPrepaidBalance.balance_amount < prepaid_info.threshold_amount && (
                      <div>
                        <Badge variant="destructive">Low Balance</Badge>
                      </div>
                    )
                  }
                </div>
              ) : null}

              {paytype == 0 && prepaid_balances && prepaid_balances.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {'Current Balance'}
                  </span>
                  <div>
                    <LowBalanceBadge row={{
                      original: {
                        connections: {
                          prepaid_balances: prepaid_balances,
                          prepaid_info: prepaid_info
                        }
                      }
                    }} />
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
        {paytype == -1 && submeter_readings && submeter_readings.length > 0 && (
          <SubmeterReadingsDashboard data={submeter_readings} />
        )}
        {paytype == 0 && prepaid_balances && prepaid_balances.length > 0 ? (
          <Card>
            <Tabs defaultValue="graph" className="w-full">
              <TabsList className="m-4">
                <TabsTrigger value="graph">Graphical View</TabsTrigger>
                <TabsTrigger value="tabular">Tabular View</TabsTrigger>
              </TabsList>
              <TabsContent value="graph">
                <PrepaidBalancesChart prepaid_balances={prepaid_balances} />
              </TabsContent>
              <TabsContent value="tabular">
                <CardHeader>
                  <CardTitle>Prepaid Balances Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardTitle>Latest Balance</CardTitle>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fetch Date</TableHead>
                        <TableHead>Balance Amount (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prepaid_balances.map(
                        (bill: PrepaidBalanceProps, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{ddmmyy(bill.fetch_date)}</TableCell>
                            <TableCell>
                              {formatRupees(bill.balance_amount)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        ) : null}

        {/* {
          submeter_readings && submeter_readings.length > 0 ? (
            <ProfileSubmeterReadingsTable data={submeter_readings} />
          ) : null} */}
        {bills && bills.length > 0 ? (
          <BillTable data={bills} />
        ) : null}
        {
          prepaid_recharge && prepaid_recharge.length > 0 ? (
            <PrepaidRechargeTable data={prepaid_recharge} />
          ) : null}

        {payments && payments.length > 0 ? (
          <PaymentTable data={payments} />
        ) : null}
        {
          events.length > 0 ? (
            <Timeline location="Electricity Bill Timeline" events={events} />
          ) : null
        }
      </div>
    );
  }

  // Return fallback UI when data is not available
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No profile data available
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
