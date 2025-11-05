'use client';
interface BlogContentProps {
    html: string;
    className?: string;
}
export function BlogContent({ html }: BlogContentProps) {
    return (
        <div
            className='prose-headings:font-title font-default prose mt-4 dark:prose-invert focus:outline-none mx-auto max-w-prose'
            dangerouslySetInnerHTML={{ __html: html }}
        >
        </div>
    );
} 