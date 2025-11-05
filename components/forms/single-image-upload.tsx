"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Camera, Eye, CheckCircle, AlertTriangle, X, AlertCircle, Video, StopCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ImageViewer } from "@/components/ui/image-viewer"
import WebcamComponent from "./webcam-component"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SingleImageUploadProps {
    connectionId: string
    readingDate: string
    onImageUploaded?: (imageData: {
        url: string
        filename: string
        image_type: string
        extractedReading?: string
    }) => void
}

interface UploadedImage {
    file: File
    preview: string
    imageType: 'start' | 'end'
    isValidated?: boolean
    validationMessage?: string
    extractedReading?: string
    uploadedUrl?: string
    uploadedFilename?: string
}

export default function SingleImageUpload({
    connectionId,
    readingDate,
    onImageUploaded
}: SingleImageUploadProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
    const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null)
    const [imageType, setImageType] = useState<'start' | 'end'>('start')
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
    const [duplicateData, setDuplicateData] = useState<{
        isDuplicate: boolean
        message: string
        existingData: any
    } | null>(null)
    const [pendingImage, setPendingImage] = useState<UploadedImage | null>(null)

    // Camera states
    const [isCameraMode, setIsCameraMode] = useState(false)

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    // Simplified camera handlers for WebcamComponent
    const handleImageCaptured = async (file: File) => {
        // Create preview
        const preview = URL.createObjectURL(file)
        const newImage: UploadedImage = {
            file,
            preview,
            imageType
        }

        setUploadedImage(newImage)
        setIsCameraMode(false)

        toast({
            title: "Photo Captured",
            description: "Photo captured successfully! Processing...",
        })

        await uploadAndValidateImage(newImage)
    }

    const toggleCameraMode = () => {
        setIsCameraMode(!isCameraMode)
    }

    const checkForDuplicateReading = async (image: UploadedImage) => {
        try {
            const response = await fetch('/api/meter-reading-upload/check-duplicate-reading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    connection_id: connectionId,
                    reading_date: readingDate,
                    image_type: image.imageType,
                    start_reading: image.imageType === 'start' ? image.extractedReading : null,
                    end_reading: image.imageType === 'end' ? image.extractedReading : null
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to check for duplicates')
            }

            return result
        } catch (error) {
            console.error('Error checking for duplicate reading:', error)
            return {
                isDuplicate: false,
                message: "Unable to check for duplicates",
                existingData: null
            }
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return

        const file = files[0]

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please select an image file",
                variant: "destructive"
            })
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: "File Too Large",
                description: "Image must be less than 10MB",
                variant: "destructive"
            })
            return
        }

        // Create preview
        const preview = URL.createObjectURL(file)
        const newImage: UploadedImage = {
            file,
            preview,
            imageType
        }

        setUploadedImage(newImage)
        await uploadAndValidateImage(newImage)
    }

    const uploadAndValidateImage = async (image: UploadedImage) => {
        setIsLoading(true)
        setIsValidating(true)

        try {
            // First, validate the image
            const validationFormData = new FormData()
            validationFormData.append('image', image.file)
            validationFormData.append('reading_type', image.imageType)

            const validationResponse = await fetch('/api/meter-reading-upload/validate-image', {
                method: 'POST',
                body: validationFormData
            })

            const validationResult = await validationResponse.json()

            if (!validationResponse.ok) {
                throw new Error(validationResult.error || 'Validation failed')
            }

            // Update image with validation results
            const updatedImage = {
                ...image,
                isValidated: validationResult.isReadingVisible,
                validationMessage: validationResult.message,
                extractedReading: validationResult.extractedReading
            }

            setUploadedImage(updatedImage)

            if (!validationResult.isReadingVisible) {
                toast({
                    title: "Validation Failed",
                    description: validationResult.message,
                    variant: "destructive"
                })
                setIsLoading(false)
                setIsValidating(false)
                return
            }

            // Check for duplicate reading after validation and reading extraction
            const duplicateCheck = await checkForDuplicateReading(updatedImage)

            if (duplicateCheck.isDuplicate) {
                setDuplicateData(duplicateCheck)
                setPendingImage(updatedImage)
                setShowDuplicateDialog(true)
                setIsLoading(false)
                setIsValidating(false)
                return
            }

            // Upload the image to storage only (no database update)
            const uploadFormData = new FormData()
            uploadFormData.append('image', image.file)
            uploadFormData.append('connection_id', connectionId)
            uploadFormData.append('reading_date', readingDate)
            uploadFormData.append('image_type', image.imageType)

            const uploadResponse = await fetch('/api/meter-reading-upload/upload-single', {
                method: 'POST',
                body: uploadFormData
            })

            const uploadResult = await uploadResponse.json()

            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error || 'Upload failed')
            }

            // Update image with upload results
            const finalImage = {
                ...updatedImage,
                uploadedUrl: uploadResult.url,
                uploadedFilename: uploadResult.filename
            }

            setUploadedImage(finalImage)

            // Notify parent component
            if (onImageUploaded) {
                onImageUploaded({
                    url: uploadResult.url,
                    filename: uploadResult.filename,
                    image_type: image.imageType,
                    extractedReading: validationResult.extractedReading
                })
            }

            toast({
                title: "Success",
                description: `${image.imageType.charAt(0).toUpperCase() + image.imageType.slice(1)} reading image uploaded successfully!`
            })

        } catch (error) {
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload image",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setIsValidating(false)
        }
    }

    const removeImage = () => {
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage.preview)
            setUploadedImage(null)
        }
        if (isCameraMode) {
            setIsCameraMode(false)
        }
    }

    const changeImageType = (newType: 'start' | 'end') => {
        setImageType(newType)
        if (uploadedImage) {
            setUploadedImage({
                ...uploadedImage,
                imageType: newType
            })
        }
    }

    const handleProceedWithUpdate = async () => {
        if (pendingImage) {
            setShowDuplicateDialog(false)
            setDuplicateData(null)
            setPendingImage(null)
            await uploadImageDirectly(pendingImage)
        }
    }

    const handleCancelUpdate = () => {
        setShowDuplicateDialog(false)
        setDuplicateData(null)
        setPendingImage(null)
        if (uploadedImage) {
            removeImage()
        }
    }

    const uploadImageDirectly = async (image: UploadedImage) => {
        setIsLoading(true)
        setIsValidating(false)

        try {
            // Upload the image to storage only (no database update)
            const uploadFormData = new FormData()
            uploadFormData.append('image', image.file)
            uploadFormData.append('connection_id', connectionId)
            uploadFormData.append('reading_date', readingDate)
            uploadFormData.append('image_type', image.imageType)

            const uploadResponse = await fetch('/api/meter-reading-upload/upload-single', {
                method: 'POST',
                body: uploadFormData
            })

            const uploadResult = await uploadResponse.json()

            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error || 'Upload failed')
            }

            // Update image with upload results
            const finalImage = {
                ...image,
                uploadedUrl: uploadResult.url,
                uploadedFilename: uploadResult.filename
            }

            setUploadedImage(finalImage)

            // Notify parent component
            if (onImageUploaded) {
                onImageUploaded({
                    url: uploadResult.url,
                    filename: uploadResult.filename,
                    image_type: image.imageType,
                    extractedReading: image.extractedReading
                })
            }

            toast({
                title: "Success",
                description: `${image.imageType.charAt(0).toUpperCase() + image.imageType.slice(1)} reading image uploaded successfully!`
            })

        } catch (error) {
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload image",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Image Upload Or Camera
                    </CardTitle>
                    <CardDescription>
                        Upload a meter reading image with type selection
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Image Type Selection */}
                    <div className="space-y-3">
                        <Label>Reading Type</Label>
                        <RadioGroup
                            value={imageType}
                            onValueChange={(value: 'start' | 'end') => changeImageType(value)}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="start" id="start" color="blue" />
                                <Label htmlFor="start" className="flex items-center gap-2 cursor-pointer">
                                    Morning Reading
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="end" id="end" color="green" />
                                <Label htmlFor="end" className="flex items-center gap-2 cursor-pointer">
                                    Evening Reading
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Upload Options */}
                    <div className="space-y-2">
                        <Label>Upload Image</Label>
                        {!uploadedImage ? (
                            <div className="space-y-4">
                                {/* Upload Mode Toggle */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                    <Button
                                        type="button"
                                        variant={!isCameraMode ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setIsCameraMode(false)}
                                        className="flex-1"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        File Upload
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={isCameraMode ? "default" : "ghost"}
                                        size="sm"
                                        onClick={toggleCameraMode}
                                        className="flex-1"
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        Camera
                                    </Button>
                                </div>

                                {/* File Upload Mode */}
                                {!isCameraMode && (
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all hover:border-gray-400 hover:bg-gray-50/50">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="p-4 rounded-full bg-gray-100">
                                                <Upload className="h-8 w-8 text-gray-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-semibold text-gray-900">Upload {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Reading</h4>
                                                <p className="text-sm text-gray-600">Photo of {imageType} meter reading</p>
                                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                                    <span className="px-2 py-1 bg-gray-100 rounded">JPG</span>
                                                    <span className="px-2 py-1 bg-gray-100 rounded">PNG</span>
                                                    <span className="px-2 py-1 bg-gray-100 rounded">GIF</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>Max 10MB</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={isLoading}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isLoading}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Choose File
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Camera Mode */}
                                {isCameraMode && (
                                    <WebcamComponent
                                        setShowCamera={setIsCameraMode}
                                        setImageUrl={() => { }} // Not used in this integration
                                        onImageCaptured={handleImageCaptured}
                                        imageType={imageType}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative group">
                                    <img
                                        src={uploadedImage.preview}
                                        alt={`${imageType} meter reading`}
                                        className="w-full h-64 sm:h-96 object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                                        onClick={() => setViewingImage({ src: uploadedImage.preview, alt: `${imageType} meter reading` })}
                                    />

                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white touch-manipulation"
                                            onClick={() => setViewingImage({ src: uploadedImage.preview, alt: `${imageType} meter reading` })}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="absolute bottom-3 left-3 flex gap-2">
                                        <Badge
                                            className={`${uploadedImage.isValidated ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-semibold`}
                                        >
                                            {uploadedImage.isValidated ? '✓ Validated' : '✗ Invalid'}
                                        </Badge>
                                        <Badge className={`${imageType === 'start' ? 'bg-blue-500' : 'bg-green-500'} hover:opacity-80 text-white font-semibold`}>
                                            {imageType.charAt(0).toUpperCase() + imageType.slice(1)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Extracted Reading */}
                                {uploadedImage.extractedReading && (
                                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="font-semibold text-blue-800">Extracted Reading</span>
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-blue-600">
                                            {uploadedImage.extractedReading}
                                        </div>
                                    </div>
                                )}

                                {/* Validation Status */}
                                {uploadedImage.isValidated !== undefined && (
                                    <Alert className={`${uploadedImage.isValidated ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"} rounded-xl`}>
                                        <div className="flex items-start gap-3">
                                            {uploadedImage.isValidated ?
                                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> :
                                                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                            }
                                            <div className="flex-1">
                                                <AlertTitle className={`${uploadedImage.isValidated ? "text-green-800" : "text-red-800"} font-semibold`}>
                                                    {uploadedImage.isValidated ? `✓ ${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Validated` : `✗ ${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image Validation Failed`}
                                                </AlertTitle>
                                                <AlertDescription className={`${uploadedImage.isValidated ? "text-green-700" : "text-red-700"} mt-2`}>
                                                    {uploadedImage.validationMessage}
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                )}

                                {/* Loading State */}
                                {(isLoading || isValidating) && (
                                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <div className="text-blue-700 font-medium">
                                                {isValidating ? 'Validating image...' : 'Uploading image...'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Image Viewer Modal */}
            {viewingImage && (
                <ImageViewer
                    src={viewingImage.src}
                    alt={viewingImage.alt}
                    isOpen={!!viewingImage}
                    onClose={() => setViewingImage(null)}
                />
            )}

            {/* Duplicate Reading Alert Dialog */}
            <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className={`h-5 w-5 ${duplicateData?.existingData?.duplicate_type === 'exact_match' ? 'text-red-500' : 'text-amber-500'}`} />
                            {duplicateData?.existingData?.duplicate_type === 'exact_match' ? 'Exact Duplicate Found' : 'Reading Already Exists'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            {duplicateData?.message}
                            {duplicateData?.existingData?.duplicate_type === 'exact_match' && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                    This appears to be an exact duplicate. No update is needed as the reading and image already exist with the same values.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {duplicateData?.existingData && (
                        <div className="my-4 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Reading Comparison:</h4>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="font-medium text-gray-600 mb-1">Connection ID:</div>
                                        <div className="text-gray-800">{duplicateData.existingData.connection_id}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-600 mb-1">Reading Date:</div>
                                        <div className="text-gray-800">{duplicateData.existingData.reading_date}</div>
                                    </div>
                                </div>

                                {/* Reading Values Comparison */}
                                <div className="space-y-2">
                                    <div className="font-medium text-gray-600">Reading Values:</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {duplicateData.existingData.start_reading !== undefined && (
                                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                <span className="text-gray-600">Start Reading:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">{duplicateData.existingData.start_reading}</span>
                                                    {duplicateData.existingData.new_start_reading && (
                                                        <>
                                                            <span className="text-gray-400">→</span>
                                                            <span className={`font-mono ${duplicateData.existingData.start_reading_match ? 'text-green-600' : 'text-blue-600'}`}>
                                                                {duplicateData.existingData.new_start_reading}
                                                            </span>
                                                            {duplicateData.existingData.start_reading_match && (
                                                                <Badge variant="secondary" className="text-xs">Match</Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {duplicateData.existingData.end_reading !== undefined && (
                                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                <span className="text-gray-600">End Reading:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">{duplicateData.existingData.end_reading}</span>
                                                    {duplicateData.existingData.new_end_reading && (
                                                        <>
                                                            <span className="text-gray-400">→</span>
                                                            <span className={`font-mono ${duplicateData.existingData.end_reading_match ? 'text-green-600' : 'text-blue-600'}`}>
                                                                {duplicateData.existingData.new_end_reading}
                                                            </span>
                                                            {duplicateData.existingData.end_reading_match && (
                                                                <Badge variant="secondary" className="text-xs">Match</Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Duplicate Type Indicator */}
                                <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-600">Duplicate Type:</div>
                                    <Badge
                                        variant={duplicateData.existingData.duplicate_type === 'exact_match' ? 'destructive' :
                                            duplicateData.existingData.duplicate_type === 'image_exists' ? 'secondary' : 'outline'}
                                        className={`text-xs ${duplicateData.existingData.duplicate_type === 'exact_match' ? 'animate-pulse' : ''}`}
                                    >
                                        {duplicateData.existingData.duplicate_type === 'exact_match' ? '⚠️ Exact Match' :
                                            duplicateData.existingData.duplicate_type === 'image_exists' ? 'Image Exists' :
                                                duplicateData.existingData.duplicate_type === 'reading_match' ? 'Reading Match' : 'General'}
                                    </Badge>
                                </div>

                                {/* Image Status */}
                                <div className="flex gap-2">
                                    {duplicateData.existingData.has_start_image && (
                                        <Badge variant="secondary" className="text-xs">Start Image ✓</Badge>
                                    )}
                                    {duplicateData.existingData.has_end_image && (
                                        <Badge variant="secondary" className="text-xs">End Image ✓</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelUpdate}>
                            Cancel
                        </AlertDialogCancel>
                        {duplicateData?.existingData?.duplicate_type !== 'exact_match' && (
                            <AlertDialogAction
                                onClick={handleProceedWithUpdate}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                Update Reading
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
