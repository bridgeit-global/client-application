import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPostNotFound() {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-xl text-muted-foreground mb-8">
                The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
                <Link href="/blog">Back to Blog</Link>
            </Button>
        </div>
    );
}