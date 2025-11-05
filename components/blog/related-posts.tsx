import { getRelatedPosts } from "@/lib/blog";
import { BlogPostCard } from "./blog-post-card";

export async function RelatedPosts({ currentPostId, state, discom }: {
    currentPostId: string;
    state: string;
    discom: string | null;
}) {
    const posts = await getRelatedPosts(currentPostId, state, discom);

    if (posts.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
} 