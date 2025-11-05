import { searchBlogPosts } from "@/lib/blog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BlogSearch } from "@/components/blog/search";
import { ddmmyy } from "@/lib/utils/date-format";

export async function generateMetadata({ searchParams }: { searchParams: { q: string } }) {
    const query = searchParams.q || "";

    return {
        title: `Search Results: ${query} - BridgeIT Blog`,
        description: `Search results for "${query}" in electricity billing resources`,
    };
}

export default async function SearchPage({ searchParams }: { searchParams: { q: string } }) {
    const query = searchParams.q || "";
    const posts = query ? await searchBlogPosts(query) : [];

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Posts
                    </Link>
                </Button>

                <h1 className="text-3xl font-bold mb-4">Search Results</h1>
                <p className="text-xl text-muted-foreground mb-6">
                    {posts.length} {posts.length === 1 ? 'result' : 'results'} found for "{query}"
                </p>

                <div className="mb-8">
                    <BlogSearch />
                </div>
            </div>

            {posts.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post.id}>
                            <Card className="h-full transition-shadow hover:shadow-md">
                                <CardHeader>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="secondary">{post.state}</Badge>
                                        {post.discom && <Badge variant="outline">{post.discom}</Badge>}
                                    </div>
                                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                                    <CardDescription>
                                        {ddmmyy(post.created_at)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-3 text-muted-foreground">{post.excerpt}</p>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm text-primary">Read more →</p>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No blog posts found matching your search criteria.</p>
                    <p className="text-sm text-muted-foreground mb-8">Try using different keywords or browse all posts.</p>
                    <Button asChild>
                        <Link href="/blog">View All Posts</Link>
                    </Button>
                </div>
            )}
        </div>
    );
} 