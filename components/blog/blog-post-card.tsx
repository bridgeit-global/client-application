import { ddmmyy } from "@/lib/utils/date-format";

import { BlogPost } from "@/lib/blog";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
export function BlogPostCard({ post }: { post: BlogPost }) {
    return (
        <Link href={`/blog/${post.slug}`} key={post.id} className="block h-full">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/20 group">
                <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                    </CardTitle>
                    <CardDescription>
                        {ddmmyy(post.created_at)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="line-clamp-3 text-muted-foreground">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-primary font-medium group-hover:underline transition-all flex items-center">
                        Read more <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                    </p>
                </CardFooter>
            </Card>
        </Link>
    )
}