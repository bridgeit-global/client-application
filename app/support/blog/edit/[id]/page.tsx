"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import Editor from '@/components/editor/editor';
import { Skeleton } from "@/components/ui/skeleton";

type BlogFormData = {
    title: string;
    slug: string;
    excerpt: string;
    state: string;
    discom: string;
    published: boolean;
};

export default function EditBlogPost() {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { register, handleSubmit, formState: { errors }, reset, getValues, setValue } = useForm<BlogFormData>();

    useEffect(() => {
        async function fetchBlogPost() {
            try {
                const response = await fetch(`/api/blog/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch blog post');
                }

                const data = await response.json();

                reset({
                    title: data.post.title,
                    slug: data.post.slug,
                    excerpt: data.post.excerpt,
                    state: data.post.state,
                    discom: data.post.discom || '',
                    published: data.post.published,
                });

                setContent(data.post.content);
            } catch (error) {
                console.error('Error fetching blog post:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch blog post",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchBlogPost();
    }, [id, reset]);

    const onSubmit = async (data: BlogFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/blog/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    content,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update blog post');
            }

            toast({
                title: "Success",
                description: "Blog post updated successfully",
            });

            router.push('/support/blog');
            router.refresh();
        } catch (error) {
            console.error('Error updating blog post:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update blog post",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 px-4 py-6 mb-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-6 pb-4">
                    <div>
                        <Skeleton className="h-5 w-20 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div>
                        <Skeleton className="h-5 w-20 mb-2" />
                        <Skeleton className="h-24 w-full" />
                    </div>

                    <div className="mb-4">
                        <Skeleton className="h-5 w-20 mb-2" />
                        <Skeleton className="h-64 w-full" />
                    </div>

                    <div className="pt-2">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-4 py-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Edit Blog Post</h1>
            <div className="space-y-6 pb-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                        id="excerpt"
                        {...register('excerpt', { required: 'Excerpt is required' })}
                    />
                    {errors.excerpt && <p className="text-sm text-red-500">{errors.excerpt.message}</p>}
                </div>

                <div className="mb-4">
                    <Label htmlFor="content" className="mb-2 block">Content</Label>
                    <Editor
                        initialValue={content}
                        onChange={setContent}
                    />
                </div>
                <div className="pt-2">
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? 'Updating...' : 'Update Post'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 