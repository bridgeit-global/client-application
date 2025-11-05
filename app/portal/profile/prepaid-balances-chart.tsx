'use client';

import { useCallback, useEffect, useState } from 'react';
import { Line, LineChart, XAxis, YAxis, ReferenceLine, Brush } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fillDatesWithDefaultAmount } from '@/lib/utils';
import { PrepaidBalanceProps } from '@/types/prepaid-balance-type';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type BalanceData = {
  id: string;
  balance_amount: number;
  fetch_date: string;
};

export default function PrepaidBalancesChart({
  prepaid_balances
}: {
  prepaid_balances: PrepaidBalanceProps[];
}) {
  const params = useSearchParams();
  const id = params.get('id');
  const supabase = createClient();
  const data = fillDatesWithDefaultAmount(prepaid_balances);
  const [threshold, setThreshold] = useState(0); // Default threshold
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchThreshold() {
      try {
        const { data, error } = await supabase
          .from('prepaid_info')
          .select('threshold_amount')
          .eq('id', id)
          .single();

        if (error) throw error;

        setThreshold(data.threshold_amount);
        setEditValue(data.threshold_amount);
      } catch (error) {
        console.error('Error fetching threshold:', error);
      }
    }
    fetchThreshold();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditValue(threshold);
  };

  const handleSaveClick = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('prepaid_info')
        .upsert([
          {
            threshold_amount: editValue,
            id: id,
            percentage_monthly_consumption: editValue / 10
          }
        ]);
      if (error) throw error;

      setThreshold(editValue);
      setIsEditing(false);
      toast({
        title: 'Threshold updated successfully',
        description: 'The threshold has been updated successfully'
      });
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast({
        title: 'Error updating threshold',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditValue(threshold);
  };

  const formatXAxis = useCallback((dateString: number) => {
    return format(parseISO(new Date(dateString).toISOString()), 'MMM dd');
  }, []);

  return (
    <>
      <CardHeader>
        <CardTitle>Prepaid Balances Over Time</CardTitle>
        <CardDescription>
          Balance amounts by fetch date with threshold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Label htmlFor="threshold">Threshold : </Label>
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{threshold}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-8 w-8 p-0"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id="threshold"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                className="max-w-xs"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveClick}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelClick}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <ChartContainer
          config={{
            balance: {
              label: 'Balance Amount',
              color: 'hsl(var(--chart-1))'
            }
          }}
          className="h-[400px] w-full"
        >
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          >
            <XAxis
              dataKey="fetch_date"
              angle={-45}
              textAnchor="end"
              interval={1}
              height={80}
              tick={{ fontSize: 10 }}
              tickFormatter={formatXAxis}
            />
            <YAxis />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as BalanceData;
                  return (
                    <Card className="p-4">
                      <p>Date: {data.fetch_date}</p>
                      <p>Balance: {data.balance_amount.toFixed(2)}</p>
                      <p>
                        Status:{' '}
                        {data.balance_amount >= threshold ? 'Above' : 'Below'}{' '}
                        Threshold
                      </p>
                    </Card>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={threshold} stroke="red" />
            <Line
              dataKey="balance_amount"
              type={'monotone'}
              fill="var(--color-balance)"
            />
            <Brush
              dataKey="fetch_date"
              height={30}
              stroke="#e8b158"
              tickFormatter={formatXAxis}

            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
