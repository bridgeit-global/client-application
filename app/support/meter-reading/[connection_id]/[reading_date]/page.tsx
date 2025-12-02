import { SubmeterReadingForm } from "@/components/forms/submeter-reading-form"
import { getSubmeterReading } from "@/services/submeter-readings"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{
        connection_id: string
        reading_date: string
    }>
}

export default async function EditMeterReadingPage(props: PageProps) {
    const params = await props.params;
    const { data: reading, error } = await getSubmeterReading(
        params.connection_id,
        params.reading_date
    )

    if (error || !reading) {
        notFound()
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Edit Submeter Reading</h1>
                <p className="text-muted-foreground">
                    Update the submeter reading for connection {params.connection_id} on {params.reading_date}
                </p>
            </div>

            <SubmeterReadingForm
                mode="edit"
                initialData={{
                    connection_id: reading.connection_id,
                    reading_date: reading.reading_date,
                    start_reading: reading.start_reading,
                    end_reading: reading.end_reading,
                    snapshot_urls: reading.snapshot_urls as string[] ?? undefined,
                    per_day_unit: reading.per_day_unit ?? undefined,
                }}
                connection_id={params.connection_id}
                reading_date={params.reading_date}
            />
        </div>
    )
} 