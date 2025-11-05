"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Eye, Images } from "lucide-react"
import { DateRangePicker } from "./date-range-picker"
import { SubmeterReadingWithConnection } from "@/types/submeter-readings-type"
import { ddmmyy } from "@/lib/utils/date-format"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ImageViewerModal } from "@/components/image-viewer-modal"
import * as XLSX from 'xlsx'

interface SubmeterReadingsDashboardProps {
  data: SubmeterReadingWithConnection[]
}

export function SubmeterReadingsDashboard({ data }: SubmeterReadingsDashboardProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [viewerTitle, setViewerTitle] = useState("")

  const filteredData = data.filter((reading) => {
    if (!dateRange.from && !dateRange.to) return true

    const readingDate = new Date(reading.reading_date)

    if (dateRange.from && dateRange.to) {
      return readingDate >= dateRange.from && readingDate <= dateRange.to
    }

    if (dateRange.from) {
      return readingDate >= dateRange.from
    }

    if (dateRange.to) {
      return readingDate <= dateRange.to
    }

    return true
  })

  const handleDownload = () => {
    // Convert data to Excel format
    const exportData = filteredData.map(reading => ({
      'Reading Date': ddmmyy(reading.reading_date),
      'Start Reading': reading.start_reading,
      'End Reading': reading.end_reading,
      'Consumption': reading.end_reading - reading.start_reading,
      'Per Day Unit': reading.per_day_unit || '-',
      'Operator Info': reading.operator_info ? JSON.stringify(reading.operator_info) : '-',
      'Created At': reading.created_at ? ddmmyy(reading.created_at) : '-'
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submeter Readings")

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
    link.download = "submeter_readings_export.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleViewImages = (reading: SubmeterReadingWithConnection) => {
    const imageUrls = Array.isArray(reading.snapshot_urls) ? reading.snapshot_urls.filter((url): url is string => typeof url === 'string') : []
    if (imageUrls.length > 0) {
      setSelectedImages(imageUrls)
      setViewerTitle(`Meter Snapshot - ${reading.connections?.account_number}`)
      setIsViewerOpen(true)
    }
  }

  const totalConsumption = filteredData.reduce((sum, reading) => {
    return sum + (reading.end_reading - reading.start_reading)
  }, 0)

  const averagePerDay = filteredData.length > 0 
    ? filteredData.reduce((sum, reading) => sum + (reading.per_day_unit || 0), 0) / filteredData.length 
    : 0

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submeter Readings</h1>
          <p className="text-muted-foreground">View and analyze your submeter readings data</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.length}</div>
                <p className="text-xs text-muted-foreground">
                  {data.length} total readings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConsumption.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Units consumed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Per Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averagePerDay.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Units per day
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Reading</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredData.length > 0 ? filteredData[0].end_reading.toLocaleString() : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredData.length > 0 ? ddmmyy(filteredData[0].reading_date) : 'No readings'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Submeter Readings Data</CardTitle>
              <CardDescription>All submeter readings with consumption details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reading Date</TableHead>
                    <TableHead>Start Reading</TableHead>
                    <TableHead>End Reading</TableHead>
                    <TableHead>Consumption</TableHead>
                    <TableHead>Per Day Unit</TableHead>
                    <TableHead>Meter Snapshot</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((reading, index) => {
                    const consumption = reading.end_reading - reading.start_reading
                    const imageUrls = Array.isArray(reading.snapshot_urls) ? reading.snapshot_urls.filter((url): url is string => typeof url === 'string') : []
                    const hasImages = imageUrls.length > 0

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {ddmmyy(reading.reading_date)}
                        </TableCell>
                        <TableCell>
                          {reading.start_reading.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {reading.end_reading.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold">
                          {consumption.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {reading.per_day_unit ? reading.per_day_unit.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {hasImages ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImages(reading)}
                              className="flex items-center gap-2"
                            >
                              {imageUrls.length > 1 ? (
                                <>
                                  <Images className="w-4 h-4" />
                                  <span>{imageUrls.length} Images</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>View Image</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Badge variant="secondary">No image</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {reading.created_at ? ddmmyy(reading.created_at) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={selectedImages}
        title={viewerTitle}
        description="Meter reading snapshots"
      />
    </div>
  )
}
