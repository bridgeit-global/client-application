import { Suspense } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmeterReadingsDataTable } from "@/components/tables/submeter-readings/data-table"
import { fetchSubmeterReadings } from "@/services/submeter-readings"
import { SearchParamsProps } from "@/types"

interface PageProps {
    searchParams: Promise<SearchParamsProps>
}

export default async function MeterReadingPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const { data, totalCount, error, pageCount } = await fetchSubmeterReadings(searchParams)

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error Loading Data</CardTitle>
                        <CardDescription>
                            There was an error loading the submeter readings. Please try again.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
                <SubmeterReadingsDataTable side="support" data={data} totalCount={totalCount} pageCount={pageCount} />
            </Suspense>
        </div>
    )
} 