"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
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

export const columns: ColumnDef<MeterReading>[] = [
  {
    accessorKey: "meter_no",
    header: "Meter No.",
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => {
      const date = row.getValue("start_date")
      if (!date) return "-"
      try {
        return ddmmyy(date as string)
      } catch (e) {
        return date
      }
    },
  },
  {
    accessorKey: "start_reading",
    header: "Start Reading",
    cell: ({ row }) => {
      const value = row.getValue("start_reading")
      return value ? value.toLocaleString() : "-"
    },
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    cell: ({ row }) => {
      const date = row.getValue("end_date")
      if (!date) return "-"
      try {
        return ddmmyy(date as string)
      } catch (e) {
        return date
      }
    },
  },
  {
    accessorKey: "end_reading",
    header: "End Reading",
    cell: ({ row }) => {
      const value = row.getValue("end_reading")
      return value ? value.toLocaleString() : "-"
    },
  },
  {
    accessorKey: "consumption",
    header: "Consumption",
    cell: ({ row }) => {
      const value = row.getValue("consumption")
      return value ? value.toLocaleString() : "-"
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return <Badge variant="outline">{type || "N/A"}</Badge>
    },
  },
  {
    accessorKey: "multiplication_factor",
    header: "Mult. Factor",
  },
]

