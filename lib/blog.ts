import { createPublicClient } from "./supabase/server";

export type BlogPost = {
    id: string;
    title: string;
    excerpt: string;
    slug: string;
    state: string;
    discom: string | null;
    content: string;
    published: boolean;
    created_at: string;
    updated_at: string;
};

export async function getRecentBlogPosts(limit = 6): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent blog posts:', error);
        return [];
    }

    return data as BlogPost[];
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all blog posts:', error);
        return [];
    }

    return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

    if (error) {
        console.error('Error fetching blog post by slug:', error);
        return null;
    }

    return data as BlogPost;
}

export async function getUniqueStates(): Promise<string[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('state')
        .eq('published', true)
        .order('state');

    if (error) {
        console.error('Error fetching unique states:', error);
        return [];
    }

    // Remove duplicates
    const states = Array.from(new Set(data.map(item => item.state)));
    return states;
}

export async function getBlogPostsByState(state: string): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('state', state)
        .eq('published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching blog posts by state:', error);
        return [];
    }

    return data as BlogPost[];
}

export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    // Search in title, excerpt, and content
    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('published', true)
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%,state.ilike.%${query}%,discom.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error searching blog posts:', error);
        return [];
    }

    return data as BlogPost[];
}

export async function getRelatedPosts(
    currentPostId: string,
    state: string,
    discom: string | null,
    limit = 3
): Promise<BlogPost[]> {
    const supabase = createPublicClient();

    // First try to find posts with the same DISCOM
    if (discom) {
        const { data: discomPosts, error: discomError } = await supabase
            .from('blog_posts')
            .select('id, title, excerpt, slug, state, discom, created_at')
            .eq('published', true)
            .eq('discom', discom)
            .neq('id', currentPostId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (!discomError && discomPosts.length >= limit) {
            return discomPosts as BlogPost[];
        }

        // If we didn't get enough posts with the same DISCOM, we'll supplement with posts from the same state
        if (!discomError && discomPosts.length > 0) {
            const remaining = limit - discomPosts.length;

            const { data: statePosts, error: stateError } = await supabase
                .from('blog_posts')
                .select('id, title, excerpt, slug, state, discom, created_at')
                .eq('published', true)
                .eq('state', state)
                .neq('discom', discom) // Exclude the current DISCOM to avoid duplicates
                .neq('id', currentPostId)
                .order('created_at', { ascending: false })
                .limit(remaining);

            if (!stateError) {
                return [...discomPosts, ...statePosts] as BlogPost[];
            }
        }
    }

    // If we don't have a DISCOM or the above queries didn't return enough results,
    // just get posts from the same state
    const { data: statePosts, error: stateError } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('published', true)
        .eq('state', state)
        .neq('id', currentPostId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (!stateError && statePosts.length > 0) {
        return statePosts as BlogPost[];
    }

    // If still not enough, just get the most recent posts
    const { data: recentPosts, error: recentError } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, state, discom, created_at')
        .eq('published', true)
        .neq('id', currentPostId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (recentError) {
        console.error('Error fetching related posts:', recentError);
        return [];
    }

    return recentPosts as BlogPost[];
} 