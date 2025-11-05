import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('image_id')
        const connectionId = searchParams.get('connection_id')

        if (!imageId && !connectionId) {
            return NextResponse.json({
                error: "Image ID or Connection ID is required"
            }, { status: 400 })
        }

        const supabase = createClient()

        let query = supabase
            .from('image_hashes')
            .select('*')

        if (imageId) {
            query = query.eq('id', imageId)
        } else if (connectionId) {
            query = query.eq('connection_id', connectionId)
        }

        const { data: images, error: fetchError } = await query

        if (fetchError) {
            console.error('Error fetching images:', fetchError)
            return NextResponse.json({
                error: "Failed to fetch images"
            }, { status: 500 })
        }

        if (!images || images.length === 0) {
            return NextResponse.json({
                message: "No images found to delete"
            })
        }

        // Delete from storage
        const storagePaths = images.map(img => img.storage_path)
        const { error: storageError } = await supabase.storage
            .from('uploads')
            .remove(storagePaths)

        if (storageError) {
            console.error('Error deleting from storage:', storageError)
            // Continue with database cleanup even if storage deletion fails
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('image_hashes')
            .delete()
            .in('id', images.map(img => img.id))

        if (dbError) {
            console.error('Error deleting from database:', dbError)
            return NextResponse.json({
                error: "Failed to delete image records"
            }, { status: 500 })
        }

        return NextResponse.json({
            message: `Successfully deleted ${images.length} image(s)`,
            deletedCount: images.length
        })

    } catch (error) {
        console.error('Error in cleanup image:', error)
        return NextResponse.json({
            error: 'Failed to cleanup image'
        }, { status: 500 })
    }
}
