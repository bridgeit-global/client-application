'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[]; // Array of image URLs
    initialIndex?: number;
    title?: string;
    description?: string;
}

export function ImageViewerModal({
    isOpen,
    onClose,
    images,
    initialIndex = 0,
    title = "Image Viewer",
    description
}: ImageViewerModalProps) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset transformations when image changes
    const resetTransform = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    // Navigate between images
    const goToPrevious = () => {
        if (images.length > 1) {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            setCurrentIndex(newIndex);
            resetTransform();
        }
    };

    const goToNext = () => {
        if (images.length > 1) {
            const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            setCurrentIndex(newIndex);
            resetTransform();
        }
    };

    // Zoom controls
    const zoomIn = () => {
        setZoom(prev => Math.min(prev * 1.5, 5));
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(prev / 1.5, 0.5));
    };

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Rotation
    const rotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Download image
    const downloadImage = async () => {
        try {
            const currentImageUrl = images[currentIndex];
            const response = await fetch(currentImageUrl);
            const blob = await response.blob();

            if (typeof window !== 'undefined') {
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `meter-snapshot-${currentIndex + 1}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: "Image downloaded successfully"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download image",
                variant: "destructive"
            });
        }
    };

    // Mouse events for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowLeft':
                goToPrevious();
                break;
            case 'ArrowRight':
                goToNext();
                break;
            case 'Escape':
                onClose();
                break;
            case '+':
            case '=':
                zoomIn();
                break;
            case '-':
                zoomOut();
                break;
            case '0':
                resetZoom();
                break;
        }
    };

    // Add keyboard event listener
    useEffect(() => {
        if (typeof window !== 'undefined' && isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    const currentImage = images[currentIndex];

    if (!currentImage) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`${isFullscreen ? 'w-screen h-screen max-w-none max-h-none' : 'max-w-6xl max-h-[90vh]'}`}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {/* Header */}
                <DialogHeader className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                {title} {images.length > 1 && `(${currentIndex + 1} of ${images.length})`}
                            </DialogTitle>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Toolbar */}
                <div className="flex items-center justify-between p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-1">
                        {/* Navigation */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={goToPrevious}
                                    disabled={images.length <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={goToNext}
                                    disabled={images.length <= 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="mx-2 text-sm text-muted-foreground">
                                    {currentIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Zoom controls */}
                        <Button variant="ghost" size="sm" onClick={zoomOut} disabled={zoom <= 0.5}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-12 text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button variant="ghost" size="sm" onClick={zoomIn} disabled={zoom >= 5}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>

                        {/* Rotate */}
                        <Button variant="ghost" size="sm" onClick={rotate}>
                            <RotateCw className="h-4 w-4" />
                        </Button>

                        {/* Fullscreen toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>

                        {/* Download */}
                        <Button variant="ghost" size="sm" onClick={downloadImage}>
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Image Container */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-hidden bg-black/5 relative"
                    style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '60vh' }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{ cursor: zoom > 1 ? 'move' : 'default' }}
                    >
                        <img
                            ref={imageRef}
                            src={currentImage}
                            alt={`Image ${currentIndex + 1}`}
                            className="max-w-none transition-transform duration-200 ease-out"
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                maxHeight: isFullscreen ? 'calc(100vh - 120px)' : '60vh',
                                maxWidth: zoom === 1 ? '100%' : 'none'
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder-image.svg';
                            }}
                            onDoubleClick={() => {
                                if (zoom === 1) {
                                    zoomIn();
                                } else {
                                    resetZoom();
                                }
                            }}
                            draggable={false}
                        />
                    </div>

                    {/* Navigation arrows overlay */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
            {/* <DialogFooter>
                {images.length > 1 && (
                    <div className="p-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex gap-2 overflow-x-auto">
                            {images.map((imageUrl, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentIndex(index);
                                        resetTransform();
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${index === currentIndex
                                        ? 'border-primary'
                                        : 'border-transparent hover:border-muted-foreground'
                                        }`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/placeholder-image.svg';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </DialogFooter> */}
        </Dialog>
    );
}
