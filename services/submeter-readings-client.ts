export const upsertSubmeterReadingsBulk = async (
  reading_date: string,
  readings: Array<{
    connection_id: string
    start_reading: number
    end_reading: number
    snapshot_urls?: string[] | null
    per_day_unit?: number | null
  }>,
  allow_update: boolean
): Promise<{ data: { inserted: number; updated: number; reading_date: string } | null; error: any }> => {
  try {
    const response = await fetch("/api/submeter-readings/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading_date, readings, allow_update }),
    })
    const payload = await response.json()
    if (!response.ok) {
      return { data: null, error: payload?.error || "Bulk upsert failed" }
    }
    return { data: payload, error: null }
  } catch (error) {
    return { data: null, error }
  }
}


