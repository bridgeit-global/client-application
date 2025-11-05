"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ConnectionOption } from "@/services/connections"
import { createClient } from "@/lib/supabase/client"

import MultipleImageUpload from "../multiple-image-upload"

interface SubmeterReadingFormProps {
    initialData?: {
        connection_id: string
        reading_date: string
        start_reading: number
        end_reading: number
        snapshot_urls?: string[],
        per_day_unit?: number
    }
    mode: "create" | "edit"
    connection_id?: string
    reading_date?: string
}

export function SubmeterReadingForm({
    initialData,
    mode,
    connection_id,
    reading_date
}: SubmeterReadingFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false)
    const [connections, setConnections] = useState<ConnectionOption[]>([])
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)

    const [formData, setFormData] = useState<{
        connection_id: string;
        reading_date: string;
        start_reading: number;
        end_reading: number;
        snapshot_urls: string[];
        per_day_unit: number;
    }>({
        connection_id: initialData?.connection_id || connection_id || "",
        reading_date: initialData?.reading_date || reading_date || "",
        start_reading: initialData?.start_reading || 0,
        end_reading: initialData?.end_reading || 0,
        snapshot_urls: initialData?.snapshot_urls || [],
        per_day_unit: initialData?.per_day_unit || 0,
    })

    // Fetch connections on component mount
    useEffect(() => {
        const loadConnections = async () => {
            if (mode === "create") {
                setIsLoadingConnections(true)
                try {
                    const { data, error } = await supabase
                        .from('connections')
                        .select('id, account_number, site_id')
                        .eq('paytype', -1)
                        .eq('is_active', true)
                        .eq('is_deleted', false)
                        .order('account_number', { ascending: true })
                    if (error) {
                        throw error;
                    }
                    setConnections(data || [])
                } catch (error) {
                    console.error("Error loading connections:", error)
                    toast({
                        title: "Error",
                        description: "Failed to load connections",
                        variant: "destructive"
                    })
                } finally {
                    setIsLoadingConnections(false)
                }
            }
        }

        loadConnections()
    }, [mode, toast])

    // Reset per_day_unit when not in rollover scenario
    useEffect(() => {
        if (formData.start_reading <= formData.end_reading) {
            // Normal scenario - reset per_day_unit to 0 or calculate automatically
            setFormData(prev => ({ ...prev, per_day_unit: 0 }))
        }
    }, [formData.start_reading, formData.end_reading])



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {

            if (mode === "create") {
                const response = await fetch("/api/submeter-readings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        connection_id: formData.connection_id,
                        reading_date: formData.reading_date,
                        start_reading: parseFloat(formData.start_reading.toString()) || 0,
                        end_reading: parseFloat(formData.end_reading.toString()) || 0,
                        snapshot_urls: formData.snapshot_urls,
                        per_day_unit: formData.per_day_unit,
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || "Failed to create reading")
                }

                toast({
                    title: "Success",
                    description: "Submeter reading created successfully"
                })
                router.push("/support/meter-reading")
                router.refresh()
            } else {
                const response = await fetch(`/api/submeter-readings/${connection_id}/${reading_date}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        start_reading: parseFloat(formData.start_reading.toString()) || 0,
                        end_reading: parseFloat(formData.end_reading.toString()) || 0,
                        snapshot_urls: formData.snapshot_urls,
                        per_day_unit: formData.per_day_unit,
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || "Failed to update reading")
                }

                toast({
                    title: "Success",
                    description: "Submeter reading updated successfully"
                })
                router.push("/support/meter-reading")
                router.refresh()
            }
        } catch (error) {
            console.error("Error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {mode === "create" ? "Add New Submeter Reading" : "Edit Submeter Reading"}
                </CardTitle>
                <CardDescription>
                    {mode === "create"
                        ? "Enter the details for the new submeter reading"
                        : "Update the submeter reading details"
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="connection_id">Meter Number</Label>
                            {mode === "create" ? (
                                <Select
                                    value={formData.connection_id}
                                    onValueChange={(value) => setFormData({ ...formData, connection_id: value })}
                                    disabled={isLoadingConnections}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingConnections ? "Loading connections..." : "Select a connection"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <ScrollArea className="max-h-[250px]">
                                            {isLoadingConnections ? (
                                                <SelectItem value="loading" disabled>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                                                        <span className="text-muted-foreground">Loading connections...</span>
                                                    </div>
                                                </SelectItem>
                                            ) : connections.length === 0 ? (
                                                <SelectItem value="no-connections" disabled>
                                                    <span className="text-muted-foreground">No submeter connections found</span>
                                                </SelectItem>
                                            ) : (
                                                connections.map((connection) => (
                                                    <SelectItem key={connection.id} value={connection.id}>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="font-medium">{connection.account_number}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {connection.site_id}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="connection_id"
                                    type="text"
                                    value={formData.connection_id.split("_")[1]}
                                    disabled
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reading_date">Reading Date</Label>
                            <Input
                                id="reading_date"
                                type="date"
                                value={formData.reading_date}
                                onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                                disabled={mode === "edit"}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_reading">Start Reading</Label>
                            <Input
                                id="start_reading"
                                type="number"
                                step="any"
                                value={formData.start_reading === 0 && formData.start_reading !== initialData?.start_reading ? "" : formData.start_reading}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        start_reading: value === "" ? 0 : parseFloat(value) || 0
                                    })
                                }}
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_reading">End Reading</Label>
                            <Input
                                id="end_reading"
                                type="number"
                                step="any"
                                value={formData.end_reading === 0 && formData.end_reading !== initialData?.end_reading ? "" : formData.end_reading}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        end_reading: value === "" ? 0 : parseFloat(value) || 0
                                    })
                                }}
                                required
                                min="0"
                            />
                            {formData.end_reading < formData.start_reading && (
                                <div className="text-sm text-yellow-600 mt-1">
                                    ⚠️ Meter rollover detected. Please enter per day unit manually below.
                                </div>
                            )}
                        </div>
                        {/* Show per_day_unit field only when start reading is greater than end reading (meter rollover) */}
                        {formData.start_reading > formData.end_reading && (
                            <div className="space-y-2">
                                <Label htmlFor="per_day_unit" className="text-orange-600 font-medium">
                                    Manual Per Day Unit (Meter Rollover)
                                </Label>
                                <Input
                                    id="per_day_unit"
                                    type="number"
                                    step="any"
                                    value={formData.per_day_unit === 0 && formData.per_day_unit !== initialData?.per_day_unit ? "" : formData.per_day_unit}
                                    onChange={(e) => setFormData({ ...formData, per_day_unit: parseFloat(e.target.value) || 0 })}
                                    required
                                    min="0"
                                    placeholder="Enter daily consumption units"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter the estimated daily unit consumption for this meter rollover period.
                                </p>
                            </div>
                        )}
                    </div>



                    {/* Images Upload Section */}
                    <div className="space-y-2">
                        <MultipleImageUpload
                            value={formData.snapshot_urls}
                            onChange={(urls: string[]) => setFormData({ ...formData, snapshot_urls: urls })}
                            onRemove={(urls: string[]) => setFormData({ ...formData, snapshot_urls: urls })}
                            label="Meter Snapshots"
                            description="Upload images of the meter reading for documentation. You can upload multiple images."
                            connectionId={formData.connection_id}
                            readingDate={formData.reading_date}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={
                                    isLoading ||
                                    // For meter rollover (start > end), require per_day_unit to be greater than 0
                                    (formData.start_reading > formData.end_reading && formData.per_day_unit <= 0)
                                }
                            >
                                {isLoading ? "Saving..." : mode === "create" ? "Create Reading" : "Update Reading"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/support/meter-reading")}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 