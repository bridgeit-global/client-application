import { getBlogPostsByState } from "@/lib/blog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ddmmyy } from "@/lib/utils/date-format";

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }) {
    const { state } = await params;
    return {
        title: `${state} Electricity Billing Resources - BridgeIT`,
        description: `Learn about electricity billing processes and DISCOM information for ${state}`,
    };
}

export default async function StateBlogPage({ params }: { params: Promise<{ state: string }> }) {
    const { state } = await params;
    const posts = await getBlogPostsByState(state);

    if (!posts.length) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/blog">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All States
                    </Link>
                </Button>

                <h1 className="text-3xl font-bold mb-4">
                    {state} Electricity Billing Resources
                </h1>
                <p className="text-xl text-muted-foreground">
                    Information about electricity providers and billing processes in {state}
                </p>
            </div>

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
        </div>
    );
}
