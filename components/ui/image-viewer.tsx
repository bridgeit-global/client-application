"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
    src: string
    alt: string
    isOpen: boolean
    onClose: () => void
    className?: string
}

export function ImageViewer({ src, alt, isOpen, onClose, className }: ImageViewerProps) {
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [touchStart, setTouchStart] = useState<{ touches: React.Touch[]; distance: number } | null>(null)
    const [lastTap, setLastTap] = useState(0)
    const imageRef = useRef<HTMLImageElement>(null)

    if (!isOpen) return null

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev * 1.2, 5))
    }

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev / 1.2, 0.1))
    }

    const handleReset = () => {
        setScale(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })
    }

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true)
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        if (e.deltaY < 0) {
            handleZoomIn()
        } else {
            handleZoomOut()
        }
    }

    const handleDownload = () => {
        const link = document.createElement('a')
        link.href = src
        link.download = alt || 'meter-reading'
        link.click()
    }

    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return 0
        const touch1 = touches[0]
        const touch2 = touches[1]
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        )
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const touches = Array.from(e.touches)

        if (touches.length === 1) {
            // Single touch - handle dragging
            if (scale > 1) {
                setIsDragging(true)
                setDragStart({
                    x: touches[0].clientX - position.x,
                    y: touches[0].clientY - position.y
                })
            }

            // Double tap detection
            const now = Date.now()
            if (now - lastTap < 300) {
                handleReset()
                setLastTap(0)
            } else {
                setLastTap(now)
            }
        } else if (touches.length === 2) {
            // Pinch gesture
            const distance = getTouchDistance(e.touches)
            setTouchStart({ touches, distance })
            setIsDragging(false)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault()
        const touches = Array.from(e.touches)

        if (touches.length === 1 && isDragging && scale > 1) {
            // Single touch drag
            setPosition({
                x: touches[0].clientX - dragStart.x,
                y: touches[0].clientY - dragStart.y
            })
        } else if (touches.length === 2 && touchStart) {
            // Pinch zoom
            const distance = getTouchDistance(e.touches)
            const scale_factor = distance / touchStart.distance
            const newScale = Math.min(Math.max(scale * scale_factor, 0.1), 5)
            setScale(newScale)
            setTouchStart({ touches, distance })
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        setTouchStart(null)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full h-full flex flex-col">
                {/* Mobile Close Button - Fixed Position */}
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onClose}
                    className="fixed top-4 right-4 z-60 text-white hover:bg-white/20 bg-black/50 rounded-full p-3 md:hidden touch-manipulation"
                    style={{ minHeight: '48px', minWidth: '48px' }}
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Header Controls */}
                <div className="flex items-center justify-between p-4 bg-black/50 text-white">
                    <h3 className="text-lg font-semibold pr-16 md:pr-0 truncate">{alt}</h3>
                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm min-w-[60px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRotate}
                            className="text-white hover:bg-white/20"
                        >
                            <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/20"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-white hover:bg-white/20"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Image Container */}
                <div
                    className="flex-1 flex items-center justify-center overflow-hidden cursor-move touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt={alt}
                        className={cn(
                            "max-w-full max-h-full object-contain transition-transform duration-200",
                            className
                        )}
                        style={{
                            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                        draggable={false}
                    />
                </div>

                {/* Mobile Controls */}
                <div className="md:hidden p-4 bg-black/50 text-white">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleZoomOut}
                            className="text-white hover:bg-white/20 touch-manipulation"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <span className="text-sm min-w-[60px] text-center font-medium">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleZoomIn}
                            className="text-white hover:bg-white/20 touch-manipulation"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleRotate}
                            className="text-white hover:bg-white/20 touch-manipulation"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                            <RotateCw className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/20 touch-manipulation"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleReset}
                            className="text-white hover:bg-white/20 touch-manipulation px-3"
                            style={{ minHeight: '44px' }}
                        >
                            <span className="text-sm">Reset</span>
                        </Button>
                    </div>
                    <p className="text-center text-xs opacity-75">Pinch to zoom • Drag to pan • Double tap to reset</p>
                </div>

                {/* Desktop Instructions */}
                <div className="hidden md:block p-4 bg-black/50 text-white text-center text-sm">
                    <p>Scroll to zoom • Drag to pan • Click controls to adjust</p>
                </div>
            </div>
        </div>
    )
}
