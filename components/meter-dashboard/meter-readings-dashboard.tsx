"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ConsumptionChart } from "./consumption-chart"
import { DateRangePicker } from "./date-range-picker"
import { MeterSummary } from "./meter-summary"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import * as XLSX from 'xlsx';

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

export function MeterReadingsDashboard({ data }: { data: MeterReading[] }) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  })


  const filteredData = data.filter((reading) => {
    if (!dateRange.from && !dateRange.to) return true

    const endDate = new Date(reading.end_date)

    if (dateRange.from && dateRange.to) {
      return endDate >= dateRange.from && endDate <= dateRange.to
    }

    if (dateRange.from) {
      return endDate >= dateRange.from
    }

    if (dateRange.to) {
      return endDate <= dateRange.to
    }

    return true
  })
  const handleDownload = () => {
    // Convert data to Excel format
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meter Readings")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    })

    // Create and download file
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "meter_readings_export.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meter Readings</h1>
          <p className="text-muted-foreground">View and analyze your electricity meter readings data</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MeterSummary data={filteredData} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Consumption Over Time</CardTitle>
                <CardDescription>Electricity consumption (kWh) by date</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ConsumptionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Meter Distribution</CardTitle>
                <CardDescription>Consumption by meter number</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ConsumptionChart data={filteredData} groupBy="meter_no" chartType="bar" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Meter Readings Data</CardTitle>
              <CardDescription>All meter readings with calculated consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

