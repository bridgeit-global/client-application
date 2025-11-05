import { createPublicClient } from '@/lib/supabase/server';
import { toKebabCase } from '@/lib/utils/string-format';

import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createPublicClient();

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, excerpt, content, published } = body;

        const supabase = createPublicClient();

        // Check if we're only updating the published status
        if (Object.keys(body).length === 1 && published !== undefined) {
            // Simple update for just the published status
            const { data, error } = await supabase
                .from('blog_posts')
                .update({ published })
                .eq('id', params.id)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ post: data });
        }

        // For full updates, require all fields
        if (!title || !excerpt || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if slug is unique (excluding current post)
        const { data: existingPost, error: checkError } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', toKebabCase(title))
            .neq('id', params.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
            return NextResponse.json({ error: 'Error checking slug' }, { status: 500 });
        }

        if (existingPost) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }

        // Update blog post with all fields
        const { data, error } = await supabase
            .from('blog_posts')
            .update({
                title,
                slug: toKebabCase(title),
                excerpt,
                content,
                published: published || false,
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Error updating blog post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createPublicClient();

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', params.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 