import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRecentBlogPosts } from "@/lib/blog"; // You'll need to create this function
import { ddmmyy } from "@/lib/utils/date-format";
import { BlogPostCard } from "./blog-post-card";

export async function RecentBlogSection() {
    const posts = await getRecentBlogPosts(3); // Fetch 3 most recent posts

    return (
        <section id="blogs" className="my-12 flex flex-col items-center justify-center py-8 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Latest Resources
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
                        Insights and guides on electricity billing across India
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8">
                            <p className="text-muted-foreground">No blog posts available yet.</p>
                        </div>
                    )}
                </div>

                <div className="mt-10 flex justify-center">
                    <Link href="/blog">
                        <Button variant="outline" size="lg" className="group">
                            View all resources
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
} 