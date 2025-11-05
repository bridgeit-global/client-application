"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { ddmmyy } from "@/lib/utils/date-format";
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type Blog = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    state: string;
    discom: string | null;
    published: boolean;
    created_at: string;
    updated_at: string;
};

export default function BlogManagementPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchBlogs();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredBlogs(blogs);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredBlogs(
                blogs.filter(
                    blog =>
                        blog.title.toLowerCase().includes(term)
                )
            );
        }
    }, [searchTerm, blogs]);

    const fetchBlogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/blog');
            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }
            const data = await response.json();
            setBlogs(data.posts);
            setFilteredBlogs(data.posts);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast({
                title: "Error",
                description: "Failed to load blog posts",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublishToggle = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/blog/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    published: !currentStatus,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update blog status');
            }

            // Update local state
            setBlogs(blogs.map(blog =>
                blog.id === id ? { ...blog, published: !currentStatus } : blog
            ));

            toast({
                title: "Success",
                description: `Blog ${!currentStatus ? 'published' : 'unpublished'} successfully`,
            });
        } catch (error) {
            console.error('Error updating blog status:', error);
            toast({
                title: "Error",
                description: "Failed to update blog status",
                variant: "destructive",
            });
        }
    };

    const handleDeleteBlog = async () => {
        if (!blogToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/blog/${blogToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete blog');
            }

            // Update local state
            setBlogs(blogs.filter(blog => blog.id !== blogToDelete));
            setBlogToDelete(null);

            toast({
                title: "Success",
                description: "Blog deleted successfully",
            });
        } catch (error) {
            console.error('Error deleting blog:', error);
            toast({
                title: "Error",
                description: "Failed to delete blog",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Blog Management</h1>
                    <p className="text-muted-foreground">Manage and publish electricity billing resources</p>
                </div>
                <Button asChild>
                    <Link href="/support/blog/create">
                        <Plus className="mr-2 h-4 w-4" /> Create New Post
                    </Link>
                </Button>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search blogs by title."
                        className="pl-10 w-full max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-6 w-4/5" />
                                <Skeleton className="h-4 w-24 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5 mt-2" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-9 w-20 mr-2" />
                                <Skeleton className="h-9 w-20" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    {filteredBlogs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">No blog posts found</p>
                            <Button asChild>
                                <Link href="/support/blog/create">Create New Post</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredBlogs.map((blog) => (
                                <Card key={blog.id} className={`overflow-hidden border-l-4 ${blog.published ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{blog.title}</CardTitle>
                                        <CardDescription>
                                            Last updated: {ddmmyy(blog.updated_at)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-2 text-muted-foreground mb-4">{blog.excerpt}</p>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id={`publish-${blog.id}`}
                                                    checked={blog.published}
                                                    onCheckedChange={() => handlePublishToggle(blog.id, blog.published)}
                                                />
                                                <label htmlFor={`publish-${blog.id}`} className="text-sm cursor-pointer">
                                                    {blog.published ? 'Published' : 'Draft'}
                                                </label>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Slug: <span className="font-mono">{blog.slug}</span>
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-between border-t bg-muted/30 p-4">
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" asChild>
                                                <Link href={`/support/blog/edit/${blog.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/blog/${blog.slug}`} target="_blank">
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </Link>
                                            </Button>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    More
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setBlogToDelete(blog.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Dialog open={!!blogToDelete} onOpenChange={(open) => !open && setBlogToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Blog Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this blog post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlogToDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteBlog}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}