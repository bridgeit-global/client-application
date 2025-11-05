import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const connection_id = formData.get('connection_id') as string
        const reading_date = formData.get('reading_date') as string

        if (!file || !connection_id || !reading_date) {
            return NextResponse.json({
                error: "file, connection_id, and reading_date are required"
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
            }, { status: 400 })
        }

        const supabase = createClient()

        // Create a unique filename
        const fileExtension = file.name.split('.').pop()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `meter-snapshots/${connection_id}/${reading_date}_${timestamp}.${fileExtension}`

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

        return NextResponse.json({
            url: publicUrl,
            filename: filename
        }, { status: 200 })

    } catch (error) {
        console.error('Error in upload-image route:', error)
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 })
    }
}
