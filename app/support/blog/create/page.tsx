"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { BlogPreviewModal } from '@/components/blog/blog-preview-modal';
import React from 'react';
import Editor from '@/components/editor/editor';

type BlogFormData = {
    title: string;
    slug: string;
    excerpt: string;
    state: string;
    discom: string;
    published: boolean;
};

export default function CreateBlogPost() {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, watch } = useForm<BlogFormData>();

    const onSubmit = async (data: BlogFormData) => {
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/blog', {
                method: 'POST',
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
                throw new Error(errorData.error || 'Failed to create blog post');
            }

            toast({
                title: "Success",
                description: "Blog post created successfully",
            });

            router.push('/support/blog');
            router.refresh();
        } catch (error) {
            console.error('Error creating blog post:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create blog post",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        setPreviewOpen(true);
    };

    return (
        <div className="flex flex-col gap-4 px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Create New Blog Post</h1>

            <div className="space-y-6">
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
                    <Editor onChange={setContent} />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch id="published" {...register('published')} />
                    <Label htmlFor="published">Publish</Label>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Post'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                    >
                        Preview
                    </Button>
                </div>
                <BlogPreviewModal
                    isOpen={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    post={{
                        title: watch('title') || 'Untitled Post',
                        content: content,
                        state: watch('state') || 'State',
                        discom: watch('discom') || null,
                    }}
                />
            </div>
        </div>
    );
} 