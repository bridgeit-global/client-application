"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { upsertSubmeterReadingsBulk } from "@/services/submeter-readings-client"

type ConnectionLite = { id: string; account_number: string; site_id: string }

export default function SubmeterReadingsBulkForm() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Default date: yesterday
  const yesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])
  const todayStr = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])
  const [readingDate, setReadingDate] = useState(yesterday)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [connections, setConnections] = useState<ConnectionLite[]>([])
  const [values, setValues] = useState<Record<string, { start: string; end: string; perDay: string }>>({})
  const [baseline, setBaseline] = useState<Record<string, { start: string; end: string; perDay: string }>>({})
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [allowUpdate, setAllowUpdate] = useState(false)
  // Reminder text (no separate start/end option; mention both)
  const missingConnections = useMemo(() => connections.filter(c => !existingIds.has(c.id)), [connections, existingIds])
  const reminderText = useMemo(() => {
    const siteIds = missingConnections.map(c => c.site_id).filter(Boolean)
    const humanDate = (() => {
      if (!readingDate) return ""
      const d = new Date(`${readingDate}T00:00:00`)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    })()
    return `Reminder: Please record submeter readings for site IDs: ${siteIds.join(', ')} on ${humanDate} (Start time and End time).`
  }, [missingConnections, readingDate])

  useEffect(() => {
    const loadConnections = async () => {
      setIsLoadingConnections(true)
      try {
        const { data, error } = await supabase
          .from("connections")
          .select("id, account_number, site_id")
          .eq("paytype", -1)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("account_number", { ascending: true })
        if (error) throw error
        setConnections(data || [])
        const init: Record<string, { start: string; end: string; perDay: string }> = {}
          ; (data || []).forEach((c) => {
            init[c.id] = { start: "", end: "", perDay: "" }
          })
        setValues(init)
      } catch (e) {
        toast({ title: "Error", description: "Failed to load connections", variant: "destructive" })
      } finally {
        setIsLoadingConnections(false)
      }
    }
    loadConnections()
  }, [supabase, toast])

  // Prefill values when a date is chosen by fetching existing readings for that date
  useEffect(() => {
    const loadExistingForDate = async () => {
      if (!readingDate || connections.length === 0) return
      setIsLoadingExisting(true)
      try {
        const params = new URLSearchParams({
          reading_date_start: readingDate,
          reading_date_end: readingDate,
          limit: String(100000),
        })
        const res = await fetch(`/api/submeter-readings?${params.toString()}`)
        const payload = await res.json()
        if (!res.ok) throw new Error(payload?.error || "Failed to fetch existing readings")
        const byId: Record<string, { start: string; end: string; perDay: string }> = {}
          ; (payload?.data || []).forEach((r: any) => {
            byId[r.connection_id] = {
              start: typeof r.start_reading === "number" ? String(r.start_reading) : (r.start_reading || ""),
              end: typeof r.end_reading === "number" ? String(r.end_reading) : (r.end_reading || ""),
              perDay: r.per_day_unit ? String(r.per_day_unit) : "",
            }
          })
        // On date change, clear all inputs and then prefill with existing readings for that date
        const cleared: Record<string, { start: string; end: string; perDay: string }> = {}
        connections.forEach(c => {
          cleared[c.id] = { start: "", end: "", perDay: "" }
        })
        const next = { ...cleared }
        Object.entries(byId).forEach(([id, vals]) => {
          if (next[id]) next[id] = vals
        })
        setValues(next)
        setBaseline(next)
        setExistingIds(new Set(Object.keys(byId)))
      } catch (e) {
        toast({ title: "Error", description: "Failed to load existing readings for date", variant: "destructive" })
      } finally {
        setIsLoadingExisting(false)
      }
    }
    loadExistingForDate()
  }, [readingDate, connections, toast])

  const totalToSubmit = useMemo(() =>
    Object.values(values).filter(v => v.start !== "" && v.end !== "").length
    , [values])

  const handleChange = (id: string, field: "start" | "end" | "perDay", val: string) => {
    setValues(prev => {
      const nextForId = { ...prev[id], [field]: val }
      const startNum = nextForId.start === "" ? NaN : parseFloat(nextForId.start)
      const endNum = nextForId.end === "" ? NaN : parseFloat(nextForId.end)
      // Auto-calc per-day units for normal case (no rollover)
      if (!Number.isNaN(startNum) && !Number.isNaN(endNum) && startNum <= endNum) {
        const diff = endNum - startNum
        const rounded = Math.round(diff * 10) / 10
        nextForId.perDay = rounded.toFixed(1)
      }
      return { ...prev, [id]: nextForId }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!readingDate) {
      toast({ title: "Date required", description: "Please choose a reading date", variant: "destructive" })
      return
    }
    const entries = Object.entries(values).filter(([, v]) => v.start !== "" && v.end !== "")
    const readings = entries
      .map(([connection_id, v]) => ({
        connection_id,
        start_reading: parseFloat(v.start) || 0,
        end_reading: parseFloat(v.end) || 0,
        per_day_unit: (parseFloat(v.start) > parseFloat(v.end)) ? (parseFloat(v.perDay) || 0) : null,
      }))
      .filter((r) => {
        const b = baseline[r.connection_id]
        if (!b) return true // new entry; not in baseline
        const bStart = b.start === "" ? NaN : parseFloat(b.start)
        const bEnd = b.end === "" ? NaN : parseFloat(b.end)
        const bPer = b.perDay === "" ? null : (parseFloat(b.perDay) || 0)
        const startChanged = !Number.isNaN(bStart) ? bStart !== r.start_reading : true
        const endChanged = !Number.isNaN(bEnd) ? bEnd !== r.end_reading : true
        const perChanged = bPer !== (r.per_day_unit ?? null)
        // Only send if any changed (for existing). For new entries, we already returned true.
        return !existingIds.has(r.connection_id) || startChanged || endChanged || perChanged
      })

    if (readings.length === 0) {
      toast({ title: "No readings", description: "Enter at least one reading", variant: "destructive" })
      return
    }

    // Validate rollover entries have per-day
    const rolloverMissing = Object.entries(values).some(([, v]) => {
      if (v.start === "" || v.end === "") return false
      const start = parseFloat(v.start)
      const end = parseFloat(v.end)
      return start > end && (v.perDay === "" || Number(v.perDay) <= 0)
    })
    if (rolloverMissing) {
      toast({ title: "Missing per-day unit", description: "Provide per-day unit for rollover cases", variant: "destructive" })
      return
    }

    setIsLoading(true)
    const { data, error } = await upsertSubmeterReadingsBulk(readingDate, readings, allowUpdate)
    setIsLoading(false)
    if (error) {
      toast({ title: "Failed", description: String(error), variant: "destructive" })
      return
    }
    toast({ title: "Success", description: `Inserted ${data?.inserted || 0}, Updated ${data?.updated || 0}` })
    router.push("/support/meter-reading")
    router.refresh()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enter All Readings for a Date</CardTitle>
        <CardDescription>Fill readings across all active submeter connections for a specific date. If readings exist, you can opt to update them.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="reading_date">Reading Date</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  const d = new Date(readingDate)
                  d.setDate(d.getDate() - 1)
                  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
                  setReadingDate(`${yyyy}-${mm}-${dd}`)
                }}>Prev</Button>
                <Input id="reading_date" className="flex-1" type="date" value={readingDate} max={todayStr} onChange={(e) => {
                  const v = e.target.value
                  if (v > todayStr) {
                    setReadingDate(todayStr)
                    toast({ title: "Invalid date", description: "Reading date cannot be in the future", variant: "destructive" })
                  } else {
                    setReadingDate(v)
                  }
                }} required />
                <Button type="button" variant="outline" disabled={readingDate >= todayStr} onClick={() => {
                  const d = new Date(readingDate)
                  d.setDate(d.getDate() + 1)
                  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
                  const nextStr = `${yyyy}-${mm}-${dd}`
                  if (nextStr > todayStr) {
                    toast({ title: "Invalid date", description: "Reading date cannot be in the future", variant: "destructive" })
                    setReadingDate(todayStr)
                  } else {
                    setReadingDate(nextStr)
                  }
                }}>Next</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total to submit</Label>
              <Input value={totalToSubmit} readOnly />
            </div>
            <div className="flex items-center gap-2">
              <input id="allow_update" type="checkbox" checked={allowUpdate} onChange={(e) => setAllowUpdate(e.target.checked)} />
              <Label htmlFor="allow_update">Allow update if data exists</Label>
            </div>
          </div>

          {/* Reminder - show if any entry is missing for selected date */}
          {(!isLoadingExisting && missingConnections.length > 0) && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold text-amber-900">⚠️ Reminder</div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(reminderText)
                      toast({ title: "Reminder copied", description: "Text copied to clipboard" })
                    }}>📋 Copy</Button>
                  </div>
                  <textarea className="w-full border rounded p-2 text-sm bg-white/70" rows={4} readOnly value={reminderText} />
                </div>
              </div>
            </div>
          )}

          <div className="border rounded">
            <ScrollArea className="h-[60vh]">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-12 gap-3 px-4 py-2 font-medium bg-muted/50">
                  <div className="col-span-3">Account</div>
                  <div className="col-span-2">Site</div>
                  <div className="col-span-2">Start</div>
                  <div className="col-span-2">End</div>
                  <div className="col-span-3">Per-Day Unit (only for rollover)</div>
                </div>
                {isLoadingConnections || isLoadingExisting ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading connections…</div>
                ) : connections.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No submeter connections found</div>
                ) : (
                  connections.map((c) => {
                    const v = values[c.id] || { start: "", end: "", perDay: "" }
                    const startNum = v.start === "" ? NaN : parseFloat(v.start)
                    const endNum = v.end === "" ? NaN : parseFloat(v.end)
                    const rollover = !Number.isNaN(startNum) && !Number.isNaN(endNum) && startNum > endNum
                    return (
                      <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-2 border-t">
                        <div className="col-span-3 flex items-center gap-2">
                          <span className="font-medium">{c.account_number}</span>
                        </div>
                        <div className="col-span-2 flex items-center">{c.site_id}</div>
                        <div className="col-span-2">
                          <Input type="number" step="any" min="0" value={v.start} onChange={(e) => handleChange(c.id, "start", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" step="any" min="0" value={v.end} onChange={(e) => handleChange(c.id, "end", e.target.value)} />
                          {rollover && (
                            <div className="text-xs text-yellow-700 mt-1">Rollover detected. Provide per-day unit.</div>
                          )}
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            placeholder={rollover ? "Required if rollover" : "Auto-calculated"}
                            value={v.perDay}
                            onChange={(e) => handleChange(c.id, "perDay", e.target.value)}
                            onBlur={(e) => {
                              const raw = e.target.value
                              if (raw === "") return
                              const num = parseFloat(raw)
                              if (Number.isNaN(num)) return
                              const rounded = Math.round(num * 10) / 10
                              handleChange(c.id, "perDay", rounded.toFixed(1))
                            }}
                            disabled={!rollover}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !readingDate}>{isLoading ? "Saving…" : "Save All"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/support/meter-reading")}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


