import { getRecentBlogPosts } from "@/lib/blog";
import { BlogPostCard } from "./blog-post-card";

export async function BlogPreview() {
    const blogPosts = await getRecentBlogPosts();

    if (blogPosts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No blog posts available yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
            ))}
        </div>
    );
} 