import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllBlogPosts } from "@/lib/blog";
import { BlogSearch } from "@/components/blog/search";
import { ddmmyy } from "@/lib/utils/date-format";
import { ArrowLeft, BookOpen, Filter } from "lucide-react";
import { BlogPostCard } from "@/components/blog/blog-post-card";

export const metadata = {
    title: 'Electricity Billing Resources - BridgeIT',
    description: 'Learn about billing processes, payment methods, and contact information for electricity boards across India',
};

export default async function BlogPage() {
    const posts = await getAllBlogPosts();

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
            <header className="mb-10">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>

                </div>

                <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">Electricity Billing Resources</h1>
                    </div>
                    <p className="text-xl text-muted-foreground max-w-3xl">
                        Learn about billing processes, payment methods, and contact information for electricity boards across India
                    </p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b">
                <div className="w-full md:max-w-md">
                    <BlogSearch />
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-4">No blog posts found</p>
                    <Button variant="outline">Clear filters</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            <footer className="mt-16 border-t pt-8 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>

                    <p className="text-sm text-muted-foreground">
                        Showing {posts.length} resource{posts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </footer>
        </div>
    );
} 