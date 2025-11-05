"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, Image, Images } from "lucide-react"
import { ddmmyy } from "@/lib/utils/date-format"
import { SubmeterReadingWithConnection } from "@/types/submeter-readings-type"
import Link from "next/link"
import { useSiteName } from "@/lib/utils/site"
import { SiteAccountBoardCell } from "@/components/table-cells/site-account-board-cell"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ImageViewerModal } from "@/components/image-viewer-modal"

// Helper component for image viewing in table cells
function ImageViewerCell({ imageUrls, reading }: {
    imageUrls: string[],
    reading: SubmeterReadingWithConnection
}) {
    const [isViewerOpen, setIsViewerOpen] = useState(false)
    const isMultiple = imageUrls.length > 1

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsViewerOpen(true)}
            >
                {isMultiple ? (
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

            <ImageViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                images={imageUrls}
                title={`Meter Snapshot - ${reading.connections?.account_number}`}
                description={`Reading Date: ${ddmmyy(reading.reading_date)}`}
            />
        </>
    )
}


export const portalColumns: ColumnDef<SubmeterReadingWithConnection>[] = [
    {
        id: 'id',
        header: () => useSiteName(),
        cell: ({ row }) => <SiteAccountBoardCell row={row} />,
    },
    {
        accessorKey: "reading_date",
        header: "Reading Date",
        cell: ({ row }) => {
            const date = row.getValue("reading_date")
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
        accessorKey: "end_reading",
        header: "End Reading",
        cell: ({ row }) => {
            const value = row.getValue("end_reading")
            return value ? value.toLocaleString() : "-"
        },
    },
    {
        accessorKey: "per_day_unit",
        header: "Per Day Unit",
        cell: ({ row }) => {
            const value = row.getValue("per_day_unit")
            return value ? value.toLocaleString() : "-"
        },
    },
    {
        accessorKey: "snapshot_urls",
        header: "Meter Snapshot",
        cell: ({ row }) => {
            const reading = row.original
            const snapshotUrls = reading.snapshot_urls

            // Convert to array for consistent handling
            let imageUrls: string[] = []

            if (Array.isArray(snapshotUrls)) {
                // JSONB array from database
                imageUrls = snapshotUrls.filter((url): url is string => url !== null && typeof url === 'string' && url.trim() !== '')
            }
            if (imageUrls.length === 0) {
                return (
                    <div className="flex items-center text-muted-foreground">
                        <Image className="w-4 h-4 mr-2" />
                        <span className="text-sm">No image</span>
                    </div>
                )
            }

            return (
                <ImageViewerCell
                    imageUrls={imageUrls}
                    reading={reading}
                />
            )
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const date = row.getValue("created_at")
            if (!date) return "-"
            try {
                return ddmmyy(date as string)
            } catch (e) {
                return date
            }
        },
    }
]

export const supportColumns: ColumnDef<SubmeterReadingWithConnection>[] = [
    {
        id: 'id',
        header: () => useSiteName(),
        cell: ({ row }) => <SiteAccountBoardCell row={row} />,
    },
    {
        accessorKey: "reading_date",
        header: "Reading Date",
        cell: ({ row }) => {
            const date = row.getValue("reading_date")
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
        accessorKey: "end_reading",
        header: "End Reading",
        cell: ({ row }) => {
            const value = row.getValue("end_reading")
            return value ? value.toLocaleString() : "-"
        },
    },
    {
        accessorKey: "per_day_unit",
        header: "Per Day Unit",
        cell: ({ row }) => {
            const value = row.getValue("per_day_unit")
            return value ? value.toLocaleString() : "-"
        },
    },
    {
        accessorKey: "snapshot_urls",
        header: "Meter Snapshot",
        cell: ({ row }) => {
            const reading = row.original
            const snapshotUrls = reading.snapshot_urls

            // Convert to array for consistent handling
            let imageUrls: string[] = []

            if (Array.isArray(snapshotUrls)) {
                // JSONB array from database
                imageUrls = snapshotUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '')
            } else if (typeof snapshotUrls === 'string' && snapshotUrls.trim() !== '') {
                // Single URL string
                imageUrls = [snapshotUrls.trim()]
            }

            if (imageUrls.length === 0) {
                return (
                    <div className="flex items-center text-muted-foreground">
                        <Image className="w-4 h-4 mr-2" />
                        <span className="text-sm">No image</span>
                    </div>
                )
            }

            return (
                <ImageViewerCell
                    imageUrls={imageUrls}
                    reading={reading}
                />
            )
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const date = row.getValue("created_at")
            if (!date) return "-"
            try {
                return ddmmyy(date as string)
            } catch (e) {
                return date
            }
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const reading = row.original
            return (
                <Button variant="outline" size="sm">
                    <Link className="flex items-center gap-2" href={`/support/meter-reading/${reading.connection_id}/${reading.reading_date}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            )
        },
    },
] 