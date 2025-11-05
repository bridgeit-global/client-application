import SubmeterReadingsBulkForm from "@/components/forms/submeter-readings-bulk-form"

export default function NewMeterReadingPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Enter Submeter Readings for a Date</h1>
                <p className="text-muted-foreground">
                    Add or update readings for all active submeter connections on a specific date
                </p>
            </div>

            <SubmeterReadingsBulkForm />
        </div>
    )
} 