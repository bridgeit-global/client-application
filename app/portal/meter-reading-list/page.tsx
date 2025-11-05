import { Suspense } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmeterReadingsDataTable } from "@/components/tables/submeter-readings/data-table"
import { fetchSubmeterReadings } from "@/services/submeter-readings"
import { SearchParamsProps } from "@/types"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface PageProps {
    searchParams: SearchParamsProps
}

export default async function MeterReadingPage({ searchParams }: PageProps) {
    // Check user access - only allow operator users
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'operator') {
        redirect('/portal/dashboard')
    }
    const { data, totalCount, error, pageCount } = await fetchSubmeterReadings(searchParams, { side: 'portal' })

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
                <SubmeterReadingsDataTable side="portal" data={data} totalCount={totalCount} pageCount={pageCount} />
            </Suspense>
        </div>
    )
} 