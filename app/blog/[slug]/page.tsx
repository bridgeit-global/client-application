import { getBlogPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RelatedPosts } from "@/components/blog/related-posts";
import { ddmmyy } from "@/lib/utils/date-format";
import { BlogContent } from "@/components/blog/blog-content";

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} - BridgeIT Blog`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
            <div className="mb-8">
                <Button variant="outline" asChild className="mb-4">
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Posts
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{post.title}</h1>
                <p className="text-muted-foreground text-sm">
                    {ddmmyy(post.created_at)}
                </p>
            </div>

            <BlogContent html={post.content} className="mb-8" />

            <RelatedPosts currentPostId={post.id} state={post.state} discom={post.discom} />

            <div className="mt-8 flex justify-center">
                <Button variant="outline" asChild>
                    <Link href="/blog">Back to All Posts</Link>
                </Button>
            </div>
        </div>
    );
} 