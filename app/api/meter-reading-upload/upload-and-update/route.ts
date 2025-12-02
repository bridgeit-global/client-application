import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('image') as File
        const connection_id = formData.get('connection_id') as string
        const reading_date = formData.get('reading_date') as string
        const image_type = formData.get('image_type') as string // 'start' or 'end'
        const extracted_reading = formData.get('extracted_reading') as string

        if (!file) {
            return NextResponse.json({
                error: "Image file is required"
            }, { status: 400 })
        }

        if (!connection_id || !reading_date || !image_type) {
            return NextResponse.json({
                error: "connection_id, reading_date, and image_type are required"
            }, { status: 400 })
        }

        if (!['start', 'end'].includes(image_type)) {
            return NextResponse.json({
                error: "image_type must be either 'start' or 'end'"
            }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({
                error: "Only image files are allowed"
            }, { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                error: "File size must be less than 10MB"
            }, { status: 500 })
        }

        const supabase = await createClient()

        // Create a unique filename with image type
        const fileExtension = file.name.split('.').pop()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `meter-snapshots/${connection_id}/${reading_date}_${image_type}_${timestamp}.${fileExtension}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(filename, file, {
                contentType: file.type,
                upsert: false
            })

        if (error) {
            console.error('Error uploading file:', error)
            return NextResponse.json({
                error: "Failed to upload image"
            }, { status: 500 })
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filename)

        // Now update the database record
        // First, get the existing record to preserve other data
        const { data: existingReading, error: fetchError } = await supabase
            .from('submeter_readings')
            .select('*')
            .eq('connection_id', connection_id)
            .eq('reading_date', reading_date)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching existing reading:', fetchError)
            return NextResponse.json({
                error: "Failed to fetch existing reading"
            }, { status: 500 })
        }

        // Handle snapshot_urls - preserve existing URLs and add new one
        let snapshotUrls = existingReading?.snapshot_urls || []

        // Remove any existing URL for this image type
        snapshotUrls = snapshotUrls.filter((url: string) =>
            !url.includes(`_${image_type}_`)
        )

        // Add the new URL
        snapshotUrls.push(publicUrl)

        // Prepare update data based on whether record exists or not
        let updateData: any

        if (!existingReading) {
            // Create new record with only the current reading type
            updateData = {
                connection_id,
                reading_date,
                snapshot_urls: snapshotUrls,
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
            // Update existing record - preserve all existing data and only update specific fields
            updateData = {
                ...existingReading, // Preserve ALL existing data first
                // Then only update the fields that need to change
                connection_id,
                reading_date,
                snapshot_urls: snapshotUrls,
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

        // Upsert the record
        const { data: result, error: upsertError } = await supabase
            .from('submeter_readings')
            .upsert(updateData, {
                onConflict: 'connection_id,reading_date'
            })
            .select()
            .single()

        if (upsertError) {
            console.error('Error upserting reading:', upsertError)
            return NextResponse.json({
                error: "Failed to update reading record"
            }, { status: 500 })
        }

        return NextResponse.json({
            url: publicUrl,
            filename: filename,
            image_type: image_type,
            connection_id: connection_id,
            reading_date: reading_date,
            reading_data: result
        })

    } catch (error) {
        console.error('Error uploading and updating reading:', error)
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 })
    }
}
