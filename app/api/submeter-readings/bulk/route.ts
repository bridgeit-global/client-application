import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAndHandleDatabaseError } from "@/lib/utils/supabase-error"

type BulkReading = {
  connection_id: string
  start_reading: number
  end_reading: number
  snapshot_urls?: string[] | null
  per_day_unit?: number | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const reading_date: string | undefined = body?.reading_date
    const readings: BulkReading[] | undefined = body?.readings
    const allow_update: boolean = Boolean(body?.allow_update)

    if (!reading_date || !Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json(
        { error: "reading_date and non-empty readings array are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Fetch current user id for created_by/updated_by
    const user_id = await supabase.auth.getUser().then((res) => res.data.user?.id)

    // Split into insert vs update based on existing rows
    const connectionIds = readings.map((r) => r.connection_id)

    const { data: existingRows, error: existingErr } = await supabase
      .from("submeter_readings")
      .select("connection_id, start_reading, end_reading, per_day_unit, snapshot_urls")
      .in("connection_id", connectionIds)
      .eq("reading_date", reading_date)

    if (existingErr) {
      const handled = logAndHandleDatabaseError(existingErr, "fetch")
      return NextResponse.json({ error: handled.message }, { status: 500 })
    }

    const existingMap: Record<string, any> = {}
    ;(existingRows || []).forEach((r: any) => { existingMap[r.connection_id] = r })
    const existingSet = new Set(Object.keys(existingMap))

    const toInsert = readings
      .filter((r) => !existingSet.has(r.connection_id))
      .map((r) => ({
        connection_id: r.connection_id,
        reading_date,
        start_reading: r.start_reading,
        end_reading: r.end_reading,
        snapshot_urls: r.snapshot_urls ?? null,
        per_day_unit: r.per_day_unit ?? null,
        created_by: user_id ?? null,
      }))

    const toUpdateAll = readings.filter((r) => existingSet.has(r.connection_id))
    // Only update those that actually changed
    const toUpdate = toUpdateAll
      .filter((r) => {
        const ex = existingMap[r.connection_id]
        const startChanged = ex?.start_reading !== r.start_reading
        const endChanged = ex?.end_reading !== r.end_reading
        // Only compare per_day_unit for rollover (when provided)
        const perDayChanged = (r.per_day_unit ?? null) !== (ex?.per_day_unit ?? null)
        const snapshotsChanged = Array.isArray(r.snapshot_urls) && Array.isArray(ex?.snapshot_urls)
          ? r.snapshot_urls.join("|") !== ex.snapshot_urls.join("|")
          : (r.snapshot_urls ?? null) !== (ex?.snapshot_urls ?? null)
        return startChanged || endChanged || perDayChanged || snapshotsChanged
      })
      .map((r) => ({
        connection_id: r.connection_id,
        start_reading: r.start_reading,
        end_reading: r.end_reading,
        snapshot_urls: r.snapshot_urls ?? null,
        per_day_unit: r.per_day_unit ?? null,
        updated_by: user_id ?? null,
      }))

    const results: { inserted: number; updated: number } = { inserted: 0, updated: 0 }

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("submeter_readings")
        .insert(toInsert)
      if (insertErr) {
        const handled = logAndHandleDatabaseError(insertErr, "create")
        return NextResponse.json({ error: handled.message }, { status: 500 })
      }
      results.inserted = toInsert.length
    }

    if (toUpdateAll.length > 0 && !allow_update) {
      return NextResponse.json(
        {
          error: "Some readings for this date already exist",
          details: { existing_count: toUpdateAll.length },
        },
        { status: 409 }
      )
    }

    if (toUpdate.length > 0) {
      // Perform updates one query by one to target composite PK
      for (const r of toUpdate) {
        const { error: updErr } = await supabase
          .from("submeter_readings")
          .update({
            start_reading: r.start_reading,
            end_reading: r.end_reading,
            snapshot_urls: r.snapshot_urls,
            per_day_unit: r.per_day_unit,
            updated_by: r.updated_by,
          })
          .eq("connection_id", r.connection_id)
          .eq("reading_date", reading_date)
        if (updErr) {
          const handled = logAndHandleDatabaseError(updErr, "update")
          return NextResponse.json({ error: handled.message }, { status: 500 })
        }
        results.updated += 1
      }
    }

    return NextResponse.json({ reading_date, ...results }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


