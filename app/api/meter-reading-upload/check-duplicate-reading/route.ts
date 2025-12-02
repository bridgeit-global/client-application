import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { connection_id, reading_date, image_type, start_reading, end_reading } = await req.json()

        if (!connection_id || !reading_date) {
            return NextResponse.json({
                error: "connection_id and reading_date are required"
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Check if reading already exists for this connection and date
        const { data: existingReading, error } = await supabase
            .from('submeter_readings')
            .select('connection_id, reading_date, start_reading, end_reading, snapshot_urls')
            .eq('connection_id', connection_id)
            .eq('reading_date', reading_date)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is expected if no record exists
            console.error('Error checking for duplicate reading:', error)
            return NextResponse.json({
                error: "Failed to check for duplicate reading"
            }, { status: 500 })
        }

        const isDuplicate = !!existingReading
        let message = ""
        let existingData = null
        let duplicateType = ""

        if (isDuplicate) {
            // Check if the specific image type already exists
            const hasStartImage = existingReading.snapshot_urls?.some((url: string) =>
                url.includes('_start_') || url.includes('start')
            )
            const hasEndImage = existingReading.snapshot_urls?.some((url: string) =>
                url.includes('_end_') || url.includes('end')
            )

            // Check for reading value duplicates
            const startReadingMatch = start_reading && existingReading.start_reading &&
                parseFloat(start_reading) === parseFloat(existingReading.start_reading)
            const endReadingMatch = end_reading && existingReading.end_reading &&
                parseFloat(end_reading) === parseFloat(existingReading.end_reading)

            // Determine duplicate type and message
            if (image_type === 'start') {
                if (hasStartImage && startReadingMatch) {
                    duplicateType = "exact_match"
                    message = `Start reading (${start_reading}) and image already exist for this connection on ${reading_date}. This appears to be an exact duplicate. Do you want to update it?`
                } else if (hasStartImage) {
                    duplicateType = "image_exists"
                    message = `Start reading image already exists for this connection on ${reading_date}. Current reading: ${existingReading.start_reading}, New reading: ${start_reading}. Do you want to update it?`
                } else if (startReadingMatch) {
                    duplicateType = "reading_match"
                    message = `Start reading (${start_reading}) already exists for this connection on ${reading_date}. Do you want to update it?`
                } else {
                    duplicateType = "general"
                    message = `A reading already exists for this connection on ${reading_date}. Current start reading: ${existingReading.start_reading}, New start reading: ${start_reading}. Do you want to update it?`
                }
            } else if (image_type === 'end') {
                if (hasEndImage && endReadingMatch) {
                    duplicateType = "exact_match"
                    message = `End reading (${end_reading}) and image already exist for this connection on ${reading_date}. This appears to be an exact duplicate. Do you want to update it?`
                } else if (hasEndImage) {
                    duplicateType = "image_exists"
                    message = `End reading image already exists for this connection on ${reading_date}. Current reading: ${existingReading.end_reading}, New reading: ${end_reading}. Do you want to update it?`
                } else if (endReadingMatch) {
                    duplicateType = "reading_match"
                    message = `End reading (${end_reading}) already exists for this connection on ${reading_date}. Do you want to update it?`
                } else {
                    duplicateType = "general"
                    message = `A reading already exists for this connection on ${reading_date}. Current end reading: ${existingReading.end_reading}, New end reading: ${end_reading}. Do you want to update it?`
                }
            } else {
                duplicateType = "general"
                message = `A reading already exists for this connection on ${reading_date}. Do you want to update it?`
            }

            existingData = {
                connection_id: existingReading.connection_id,
                reading_date: existingReading.reading_date,
                start_reading: existingReading.start_reading,
                end_reading: existingReading.end_reading,
                has_start_image: hasStartImage,
                has_end_image: hasEndImage,
                snapshot_urls: existingReading.snapshot_urls,
                duplicate_type: duplicateType,
                new_start_reading: start_reading,
                new_end_reading: end_reading,
                start_reading_match: startReadingMatch,
                end_reading_match: endReadingMatch
            }
        } else {
            message = "No existing reading found. Proceeding with new reading."
        }

        return NextResponse.json({
            isDuplicate,
            message,
            existingData
        })

    } catch (error) {
        console.error('Error checking for duplicate reading:', error)
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 })
    }
}
