import { createPublicClient } from '@/lib/supabase/server';
import { toKebabCase } from '@/lib/utils/string-format';
import { NextResponse } from 'next/server';
import { handleDatabaseError, logAndHandleDatabaseError } from '@/lib/utils/supabase-error';

export async function POST(request: Request) {
    try {
        const { title, content, published, excerpt } = await request.json();

        // Basic validation
        if (!title || !content || !excerpt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createPublicClient();

        // Check if slug is unique
        const { data: existingPost, error: checkError } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', toKebabCase(title))
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
            const errorInfo = logAndHandleDatabaseError(checkError, 'checking blog post slug');
            return NextResponse.json({ error: errorInfo.message }, { status: 500 });
        }

        if (existingPost) {
            return NextResponse.json({ error: 'A blog post with this title already exists' }, { status: 400 });
        }

        // Create blog post
        const { data, error } = await supabase
            .from('blog_posts')
            .insert({
                title,
                slug: toKebabCase(title),
                excerpt,
                content,
                state: '',
                discom: '',
                published: published || false,
            })
            .select()
            .single();

        if (error) {
            const errorInfo = handleDatabaseError(error);
            return NextResponse.json({ error: errorInfo.message }, { status: 500 });
        }

        return NextResponse.json({ post: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating blog post:', error);
        return NextResponse.json({ error: 'An unexpected error occurred. Please try again or contact support.' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createPublicClient();
        const url = new URL(request.url);
        const publishedOnly = url.searchParams.get('published') === 'true';

        let query = supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter only published blogs if the parameter is set
        if (publishedOnly) {
            query = query.eq('published', true);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({ posts: data });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 