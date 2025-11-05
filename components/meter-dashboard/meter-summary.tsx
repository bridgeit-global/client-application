"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, BarChart3, Gauge, Zap } from "lucide-react"

interface MeterReading {
  meter_no: string
  end_date: string
  end_reading: number
  start_date: string
  start_reading: number
  type: string
  bill_id: string
  created_at: string
  updated_at: string
  multiplication_factor: number
  consumption?: number
}
interface MeterSummaryProps {
  data: MeterReading[]
}

export function MeterSummary({ data }: MeterSummaryProps) {
  const summaryData = useMemo(() => {
    // Total consumption
    const totalConsumption = data.reduce((sum, item) => sum + (item.consumption || 0), 0)

    // Unique meters
    const uniqueMeters = new Set(data.map((item) => item.meter_no)).size

    // Average consumption per reading
    const avgConsumption = data.length > 0 ? totalConsumption / data.length : 0

    // Max consumption in a single reading
    const maxConsumption = data.length > 0 ? Math.max(...data.map((item) => item.consumption || 0)) : 0

    return {
      totalConsumption,
      uniqueMeters,
      avgConsumption,
      maxConsumption,
    }
  }, [data])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalConsumption.toLocaleString()} kWh</div>
          <p className="text-xs text-muted-foreground">Total electricity used across all meters</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Meters</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.uniqueMeters}</div>
          <p className="text-xs text-muted-foreground">Number of different meters in the dataset</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Consumption</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summaryData.avgConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
          </div>
          <p className="text-xs text-muted-foreground">Average consumption per reading</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Max Consumption</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.maxConsumption.toLocaleString()} kWh</div>
          <p className="text-xs text-muted-foreground">Highest consumption in a single reading</p>
        </CardContent>
      </Card>
    </>
  )
}

