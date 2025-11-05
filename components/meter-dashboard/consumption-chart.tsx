"use client"

import { useMemo } from "react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format, parseISO } from "date-fns"
import { ddmmyy } from "@/lib/utils/date-format"

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

interface ConsumptionChartProps {
  data: MeterReading[]
  groupBy?: "end_date" | "meter_no"
  chartType?: "line" | "bar"
}

export function ConsumptionChart({ data, groupBy = "end_date", chartType = "line" }: ConsumptionChartProps) {
  const chartData = useMemo(() => {
    if (groupBy === "end_date") {
      // Group by date and sum consumption
      const groupedByDate = data.reduce(
        (acc, item) => {
          const date = item.end_date ? item.end_date.split("T")[0] : "Unknown"
          if (!acc[date]) {
            acc[date] = { date, consumption: 0 }
          }
          acc[date].consumption += item.consumption || 0
          return acc
        },
        {} as Record<string, { date: string; consumption: number }>,
      )

      return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date))
    } else {
      // Group by meter number and sum consumption
      const groupedByMeter = data.reduce(
        (acc, item) => {
          const meter = item.meter_no || "Unknown"
          if (!acc[meter]) {
            acc[meter] = { meter, consumption: 0 }
          }
          acc[meter].consumption += item.consumption || 0
          return acc
        },
        {} as Record<string, { meter: string; consumption: number }>,
      )

      return Object.values(groupedByMeter).sort((a, b) => b.consumption - a.consumption)
    }
  }, [data, groupBy])

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis
            dataKey={groupBy === "end_date" ? "date" : "meter"}
            tickFormatter={(value) => {
              if (groupBy === "end_date") {
                try {
                  return ddmmyy(value)
                } catch (e) {
                  return value
                }
              }
              return value
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(value) => value.toLocaleString()} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), "Consumption (kWh)"]}
            labelFormatter={(label) => {
              if (groupBy === "end_date") {
                try {
                  return ddmmyy(label)
                } catch (e) {
                  return label
                }
              }
              return `Meter: ${label}`
            }}
          />
          <Line
            type="monotone"
            dataKey="consumption"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <XAxis
          dataKey={groupBy === "end_date" ? "date" : "meter"}
          tickFormatter={(value) => {
            if (groupBy === "end_date") {
              try {
                return ddmmyy(value)
              } catch (e) {
                return value
              }
            }
            return value
          }}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickFormatter={(value) => value.toLocaleString()} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), "Consumption (kWh)"]}
          labelFormatter={(label) => {
            if (groupBy === "end_date") {
              try {
                return ddmmyy(label)
              } catch (e) {
                return label
              }
            }
            return `Meter: ${label}`
          }}
        />
        <Bar dataKey="consumption" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

