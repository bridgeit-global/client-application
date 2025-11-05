"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlogContent } from "@/components/blog/blog-content";
interface BlogPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: {
        title: string;
        content: string;
        state: string;
        discom: string | null;
    };
}

export function BlogPreviewModal({ isOpen, onClose, post }: BlogPreviewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Preview: {post.title}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <BlogContent html={post.content} />
                </div>
            </DialogContent>
        </Dialog>
    );
} 