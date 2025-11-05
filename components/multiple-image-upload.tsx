'use client';

import { useState, useRef } from 'react';
import { Camera, X, Eye, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { Label } from './ui/label';
import { Input } from './ui/input';

const IMAGE_MAX_LIMIT = 10; // Maximum number of images allowed

interface MultipleImageUploadProps {
    onChange: (urls: string[]) => void;
    onRemove: (urls: string[]) => void;
    value: string[]; // Array of image URLs
    label?: string;
    description?: string;
    disabled?: boolean;
    connectionId?: string;
    readingDate?: string;
}

export default function MultipleImageUpload({
    onChange,
    onRemove,
    value = [],
    label = "Upload Images",
    description = "Upload multiple images. Supported formats: JPG, PNG, GIF. Max size: 10MB each.",
    disabled = false,
    connectionId,
    readingDate
}: MultipleImageUploadProps) {
    const { toast } = useToast();
    const [selectedImages, setSelectedImages] = useState<{ url: string; name: string }[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDeleteImage = (urlToDelete: string) => {
        const filteredUrls = value.filter((url) => url !== urlToDelete);
        onRemove(filteredUrls);

        // Also remove from selectedImages if it exists
        setSelectedImages(prev => prev.filter(img => img.url !== urlToDelete));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        uploadFiles(Array.from(files));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files || files.length === 0) return;

        uploadFiles(Array.from(files));
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const uploadFiles = async (files: File[]) => {
        if (disabled || isUploading) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid File",
                    description: `${file.name} is not an image file`,
                    variant: "destructive"
                });
                return false;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: `${file.name} is larger than 10MB`,
                    variant: "destructive"
                });
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) return;

        // Check if adding these files would exceed the limit
        if (value.length + validFiles.length > IMAGE_MAX_LIMIT) {
            toast({
                title: "Upload Limit Exceeded",
                description: `You can only upload up to ${IMAGE_MAX_LIMIT} images. Current: ${value.length}`,
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);

        try {
            const uploadPromises = validFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                if (connectionId) formData.append('connection_id', connectionId);
                if (readingDate) formData.append('reading_date', readingDate);

                const response = await fetch('/api/submeter-readings/upload-multiple-images', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || `Failed to upload ${file.name}`);
                }

                const result = await response.json();
                return {
                    url: result.url,
                    name: file.name
                };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const newUrls = uploadedImages.map(img => img.url);
            const updatedUrls = [...value, ...newUrls];

            setSelectedImages(prev => [...prev, ...uploadedImages]);
            onChange(updatedUrls);

            toast({
                title: "Success",
                description: `${uploadedImages.length} image(s) uploaded successfully`
            });

            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload images",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const openPreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
    };

    const closePreview = () => {
        setPreviewImage(null);
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {label && <Label>{label}</Label>}

                {/* Hidden file input */}
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                {/* Upload Area */}
                {value.length < IMAGE_MAX_LIMIT && !disabled && (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={triggerFileSelect}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-slate-400">
                                    Uploading images...
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Camera className="w-8 h-8 text-primary" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Drag and drop images here, or click to browse
                                </p>
                                <p className="text-xs text-slate-500">
                                    {value.length} / {IMAGE_MAX_LIMIT} images uploaded
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerFileSelect();
                                    }}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose Files
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Display uploaded images */}
                {value.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {value.map((imageUrl, index) => {
                            const selectedImage = selectedImages.find(img => img.url === imageUrl);
                            return (
                                <div
                                    key={`${imageUrl}-${index}`}
                                    className="relative group aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Upload ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        onError={(e) => {
                                            // Handle broken images
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/placeholder-image.svg';
                                        }}
                                    />

                                    {/* Overlay with actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => openPreview(imageUrl)}
                                            variant="secondary"
                                            size="sm"
                                            className="bg-white/90 hover:bg-white"
                                            disabled={disabled}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => onDeleteImage(imageUrl)}
                                            variant="destructive"
                                            size="sm"
                                            disabled={disabled}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Image name tooltip */}
                                    {selectedImage?.name && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                            {selectedImage.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Help text */}
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}

                {/* Upload limit reached message */}
                {value.length >= IMAGE_MAX_LIMIT && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        Maximum number of images ({IMAGE_MAX_LIMIT}) reached. Remove some images to upload more.
                    </p>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={closePreview}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                            type="button"
                            onClick={closePreview}
                            variant="secondary"
                            size="sm"
                            className="absolute top-4 right-4"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
