import { BlogCardSkeleton } from './blog-card-skeleton';
import { Suspense } from 'react';
import { BlogPreview } from './blog-preview';

export function BlogPreviewSection() {
    return (
        <Suspense fallback={<BlogCardSkeleton count={3} />}>
            <BlogPreview />
        </Suspense>
    );
} 