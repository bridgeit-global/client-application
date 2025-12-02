import { createClient } from '@/lib/supabase/server'
import { fetchOrganization } from '@/services/organization'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('image') as File
        const connection_id = formData.get('connection_id') as string
        const reading_date = formData.get('reading_date') as string
        const image_type = formData.get('image_type') as string // 'start' or 'end'

        if (!file) {
            return NextResponse.json({
                error: "Image file is required"
            }, { status: 400 })
        }

        if (!connection_id || !reading_date) {
            return NextResponse.json({
                error: "connection_id and reading_date are required"
            }, { status: 400 })
        }

        if (!image_type || !['start', 'end'].includes(image_type)) {
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Authentication error:', authError)
            return NextResponse.json({
                error: "Authentication required"
            }, { status: 401 })
        }


        if (!user?.user_metadata?.site_id) {
            const { site_name } = await fetchOrganization();

            return NextResponse.json({
                error: `${site_name} ID is required`
            }, { status: 400 })
        }

        // Create a unique filename with image type
        const fileExtension = file.name.split('.').pop()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `meter-snapshots/${user?.user_metadata?.site_id}/${connection_id}/${reading_date}_${image_type}_${timestamp}.${fileExtension}`

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
            filename: filename,
            image_type: image_type,
            connection_id: connection_id,
            reading_date: reading_date
        })

    } catch (error) {
        console.error('Error uploading single image:', error)
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 })
    }
}
