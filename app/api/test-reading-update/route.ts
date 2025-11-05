import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { connection_id, reading_date, image_type, extracted_reading } = await req.json()

        const supabase = createClient()

        // Get existing reading
        const { data: existingReading, error: fetchError } = await supabase
            .from('submeter_readings')
            .select('*')
            .eq('connection_id', connection_id)
            .eq('reading_date', reading_date)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            return NextResponse.json({
                error: "Failed to fetch existing reading"
            }, { status: 500 })
        }
        // Simulate the update logic exactly as in the real API
        let updateData: any

        if (!existingReading) {
            // Create new record
            updateData = {
                connection_id,
                reading_date,
                snapshot_urls: [],
                per_day_unit: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Only set the reading field for the current image type if we have valid data
            if (image_type === 'start' && extracted_reading && extracted_reading.trim() !== '') {
                updateData.start_reading = parseFloat(extracted_reading)
            }
            if (image_type === 'end' && extracted_reading && extracted_reading.trim() !== '') {
                updateData.end_reading = parseFloat(extracted_reading)
            }
        } else {
            // Update existing record
            updateData = {
                ...existingReading,
                connection_id,
                reading_date,
                snapshot_urls: existingReading.snapshot_urls || [],
                updated_at: new Date().toISOString()
            }

            // Only update the specific reading field that's being uploaded
            if (image_type === 'start') {
                // Only update if we have a valid extracted reading
                if (extracted_reading && extracted_reading.trim() !== '') {
                    updateData.start_reading = parseFloat(extracted_reading)
                }
                // Explicitly preserve end_reading
                updateData.end_reading = existingReading.end_reading
            } else if (image_type === 'end') {
                // Only update if we have a valid extracted reading
                if (extracted_reading && extracted_reading.trim() !== '') {
                    updateData.end_reading = parseFloat(extracted_reading)
                }
                // Explicitly preserve start_reading
                updateData.start_reading = existingReading.start_reading
            }
        }
        return NextResponse.json({
            existing: existingReading,
            updateData: updateData,
            message: "Test completed - check console logs"
        })

    } catch (error) {
        console.error('Test error:', error)
        return NextResponse.json({
            error: "Test failed"
        }, { status: 500 })
    }
}
