"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Button } from "@/components/ui/button"
import { Camera, StopCircle, RotateCcw, FlipHorizontal } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WebcamComponentProps {
    setShowCamera: (show: boolean) => void
    setImageUrl: (url: string | null) => void
    onImageCaptured?: (file: File) => void
    imageType: 'start' | 'end'
}

// Mobile-optimized video constraints with orientation support
const getVideoConstraints = (isPortrait: boolean = false, facingMode: string = "environment", useSimpleConstraints: boolean = false) => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // If simple constraints are requested (for fallback), use minimal constraints
    if (useSimpleConstraints) {
        return {
            facingMode: facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
        };
    }

    if (isMobile) {
        // Always prioritize the rear camera for mobile with flexible constraints
        const baseConstraints = {
            facingMode: facingMode, // Remove exact constraint for better compatibility
        };

        if (isPortrait) {
            // Portrait mode for mobile - optimized for vertical recording
            return {
                ...baseConstraints,
                width: { ideal: 1080, max: 1920, min: 720 },
                height: { ideal: 1920, max: 2560, min: 1280 },
                aspectRatio: 9 / 16 // Portrait aspect ratio
            };
        } else {
            // Landscape mode for mobile
            return {
                ...baseConstraints,
                width: { ideal: 1920, max: 1920, min: 1280 },
                height: { ideal: 1080, max: 1080, min: 720 },
                aspectRatio: 16 / 9 // Landscape aspect ratio
            };
        }
    }

    // Desktop constraints (always landscape) - use user for front camera as fallback
    return {
        facingMode: facingMode === "environment" ? "environment" : "user",
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
    };
}

export default function WebcamComponent({
    setShowCamera,
    setImageUrl,
    onImageCaptured,
    imageType
}: WebcamComponentProps) {
    const { toast } = useToast()
    const webcamRef = useRef<Webcam>(null)
    const [isCameraReady, setIsCameraReady] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isPortrait, setIsPortrait] = useState(true)
    const [facingMode, setFacingMode] = useState("environment") // Default to rear camera
    const [videoConstraints, setVideoConstraints] = useState(getVideoConstraints(false, "environment"))
    const [hasTriedFallback, setHasTriedFallback] = useState(false)

    // Detect mobile device and orientation on component mount
    useEffect(() => {
        const checkMobileAndOrientation = () => {
            const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const portrait = window.innerHeight > window.innerWidth;

            setIsMobile(mobile);
            setIsPortrait(portrait);
            setVideoConstraints(getVideoConstraints(portrait, facingMode));
        };

        checkMobileAndOrientation();

        // Listen for orientation changes
        const handleOrientationChange = () => {
            // Small delay to ensure dimensions are updated
            setTimeout(checkMobileAndOrientation, 100);
        };

        // Re-check on window resize (for device rotation)
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [facingMode])

    // Switch between front and rear camera
    const switchCamera = useCallback(() => {
        const newFacingMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacingMode);
        setVideoConstraints(getVideoConstraints(isPortrait, newFacingMode));
        setIsCameraReady(false); // Reset camera ready state when switching
        setHasTriedFallback(false); // Reset fallback state

        toast({
            title: "Switching Camera",
            description: `Switching to ${newFacingMode === "environment" ? "rear" : "front"} camera...`,
        });
    }, [facingMode, isPortrait, toast])

    const capture = useCallback(() => {
        if (!webcamRef.current) {
            toast({
                title: "Camera Error",
                description: "Camera not ready. Please try again.",
                variant: "destructive"
            })
            return
        }

        try {
            // Get the screenshot as base64 data URL
            const imageSrc = webcamRef.current.getScreenshot()

            if (!imageSrc) {
                toast({
                    title: "Capture Failed",
                    description: "Failed to capture image. Please try again.",
                    variant: "destructive"
                })
                return
            }

            // Convert base64 to blob then to file
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `camera-capture-${imageType}-${Date.now()}.jpg`, {
                        type: 'image/jpeg'
                    })

                    // Set the image URL for preview
                    setImageUrl(imageSrc)

                    // Call the parent callback with the file
                    if (onImageCaptured) {
                        onImageCaptured(file)
                    }

                    toast({
                        title: "Photo Captured",
                        description: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} reading photo captured successfully!`,
                    })
                })
                .catch(error => {
                    console.error('Error converting captured image:', error)
                    toast({
                        title: "Capture Error",
                        description: "Failed to process captured image. Please try again.",
                        variant: "destructive"
                    })
                })
        } catch (error) {
            console.error('Error capturing photo:', error)
            toast({
                title: "Capture Error",
                description: "Failed to capture photo. Please try again.",
                variant: "destructive"
            })
        }
    }, [webcamRef, setImageUrl, onImageCaptured, imageType, toast])

    const handleUserMedia = useCallback(() => {
        setIsCameraReady(true)
        toast({
            title: "Camera Ready",
            description: "Camera is now active and ready to capture photos",
        })
    }, [toast])

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        console.error('Camera error:', error)
        let errorMessage = 'Unable to access camera. Please check permissions.'
        let shouldTryFallback = false

        if (typeof error === 'object' && error.name) {
            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = 'Camera access denied. Please allow camera permissions and try again.'
                    break
                case 'NotFoundError':
                    errorMessage = 'No camera found on this device.'
                    break
                case 'NotSupportedError':
                    errorMessage = 'Camera not supported on this device.'
                    break
                case 'NotReadableError':
                    errorMessage = 'Camera is already in use by another application.'
                    break
                case 'OverconstrainedError':
                    errorMessage = 'Requested camera not available. Trying to switch to available camera...'
                    shouldTryFallback = true
                    break
            }
        }

        // If it's an overconstrained error and we're trying to use rear camera, fallback to front camera
        if (shouldTryFallback && facingMode === "environment" && !hasTriedFallback) {
            setHasTriedFallback(true)
            const newFacingMode = "user"
            setFacingMode(newFacingMode)
            setVideoConstraints(getVideoConstraints(isPortrait, newFacingMode))

            toast({
                title: "Camera Switched",
                description: "Rear camera not available. Switched to front camera.",
                variant: "default"
            })
            return
        }

        toast({
            title: "Camera Error",
            description: errorMessage,
            variant: "destructive"
        })
        setIsCameraReady(false)
    }, [toast, facingMode, isPortrait])

    const stopCamera = useCallback(() => {
        setShowCamera(false)
        setIsCameraReady(false)
    }, [setShowCamera])

    return (
        <div className="space-y-4">
            <div className="relative">
                <Webcam
                    audio={false}
                    height={isMobile ? (isPortrait ? 400 : 300) : 400}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    videoConstraints={videoConstraints}
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                    className={`w-full rounded-xl border-2 border-gray-200 ${isMobile ? 'touch-manipulation' : ''}`}
                    style={{
                        maxWidth: isMobile ? '100%' : '500px',
                        margin: '0 auto',
                        aspectRatio: isMobile ? (isPortrait ? '9/16' : '16/9') : 'auto'
                    }}
                />

                {/* Camera status and orientation overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isCameraReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>
                        {isCameraReady ? 'Camera Ready' : 'Initializing...'}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${facingMode === 'environment' ? 'bg-blue-500' : 'bg-orange-500'
                        } text-white`}>
                        <Camera className="w-3 h-3" />
                        {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
                    </div>
                    {isMobile && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isPortrait ? 'bg-purple-500' : 'bg-indigo-500'
                            } text-white`}>
                            <div className={`w-3 h-2 border border-current rounded-sm ${isPortrait ? 'rotate-90' : ''}`}></div>
                            {isPortrait ? 'Portrait' : 'Landscape'}
                        </div>
                    )}
                </div>

                {/* Live indicator */}
                {isCameraReady && (
                    <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            LIVE
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Controls - Optimized for orientation */}
            <div className={`flex gap-2 ${isMobile && isPortrait ? 'flex-col' : 'justify-center'}`}>
                <Button
                    onClick={capture}
                    disabled={!isCameraReady}
                    className={`${isMobile && isPortrait ? 'w-full' : 'flex-1 max-w-xs'}`}
                    size={isMobile && isPortrait ? "lg" : "default"}
                >
                    <Camera className="h-4 w-4 mr-2" />
                    Capture {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Reading
                </Button>
                {isMobile && (
                    <Button
                        variant="outline"
                        onClick={switchCamera}
                        disabled={!isCameraReady}
                        className={isMobile && isPortrait ? 'w-full' : ''}
                        size={isMobile && isPortrait ? "lg" : "default"}
                    >
                        <FlipHorizontal className="h-4 w-4 mr-2" />
                        Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={stopCamera}
                    className={isMobile && isPortrait ? 'w-full' : ''}
                    size={isMobile && isPortrait ? "lg" : "default"}
                >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Camera
                </Button>
            </div>

            {/* Photography Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {isMobile ? (isPortrait ? 'Portrait Mode Photography Tips' : 'Landscape Mode Photography Tips') : 'Photography Tips'}
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ensure good lighting on the meter display</li>
                    <li>• Hold the device steady to avoid blurry images</li>
                    <li>• Make sure all digits are clearly visible</li>
                    <li>• Avoid reflections and shadows on the meter</li>
                    <li>• Take the photo from directly in front of the meter</li>
                    {isMobile && (
                        <>
                            <li>• {facingMode === 'environment' ? 'Using rear camera for better image quality' : 'Using front camera - try switching to rear camera for better quality'}</li>
                            <li>• Tap to focus on the meter reading before capturing</li>
                            <li>• Use the camera switch button to toggle between front and rear cameras</li>
                            {isPortrait ? (
                                <>
                                    <li>• Hold your phone vertically for easier one-handed operation</li>
                                    <li>• Move closer to the meter to fill the vertical frame</li>
                                    <li>• Position the meter reading in the center of the screen</li>
                                    <li>• Rotate to landscape for wider meters if needed</li>
                                </>
                            ) : (
                                <>
                                    <li>• Hold your phone in landscape mode for wider view</li>
                                    <li>• Capture more of the meter context in horizontal orientation</li>
                                    <li>• Best for meters with horizontal layouts</li>
                                </>
                            )}
                        </>
                    )}
                </ul>
            </div>
        </div>
    )
}
