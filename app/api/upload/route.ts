import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  const file = await req.blob()
  const filename = req.headers.get('x-vercel-filename') || 'file.txt'
  const contentType = req.headers.get('content-type') || 'text/plain'
  const fileType = `.${contentType.split('/')[1]}`

  // construct final filename based on content-type if not provided
  const finalName = filename.includes(fileType)
    ? filename
    : `${filename}${fileType}`

  // Initialize Supabase client with service role key for admin access
  const supabase = createClient()

  // Upload to Supabase Storage
  // You'll need to create a bucket named 'uploads' in your Supabase dashboard first
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`public/${finalName}`, file, {
      contentType,
      upsert: true
    })

  if (error) {
    console.error('Error uploading file:', error.message);
    return new Response(`Error uploading file: ${error.message}`, {
      status: 500
    })
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(`public/${finalName}`)

  return NextResponse.json({
    url: publicUrl,
    name: finalName,
    size: file.size,
    contentType
  })
}
