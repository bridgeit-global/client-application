'use client';

import { cn } from '@/lib/utils';
import { decodeBlogHtml } from '@/lib/utils/decode-blog-html';

interface BlogContentProps {
    html: string;
    className?: string;
}

export function BlogContent({ html, className }: BlogContentProps) {
    const safeHtml = decodeBlogHtml(html);
    return (
        <div
            className={cn(
                'prose-headings:font-title font-default prose mt-4 dark:prose-invert focus:outline-none mx-auto max-w-prose',
                className
            )}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    );
} 