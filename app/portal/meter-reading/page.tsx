"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/buttons/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Camera } from "lucide-react"
import { ConnectionOption } from "@/services/connections"
import { createClient } from "@/lib/supabase/client"
import SingleImageUpload from "@/components/forms/single-image-upload"
import { useSiteName } from "@/lib/utils/site"

interface UploadedImageData {
    url: string
    filename: string
    image_type: string
    extractedReading?: string
}

export default function SingleMeterReadingUploadPage() {
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const site_name = useSiteName()

    const [isLoadingConnections, setIsLoadingConnections] = useState(false)
    const [connections, setConnections] = useState<ConnectionOption[]>([])
    const [formData, setFormData] = useState({
        connection_id: "",
        reading_date: new Date().toISOString().slice(0, 10),
    })
    const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check user access and fetch connections on component mount
    useEffect(() => {
        const checkUserAccess = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const role = user.user_metadata?.role
            // Only allow access for operator users
            if (role !== 'operator') {
                toast({
                    title: "Access Denied",
                    description: "This page is only accessible to operator users.",
                    variant: "destructive"
                })
                router.push('/portal/dashboard')
                return
            }
        }

        const loadConnections = async () => {
            setIsLoadingConnections(true)


            try {

                const { data: { user } } = await supabase.auth.getUser()

                if (!user?.user_metadata?.site_id) {
                    toast({
                        title: "Error",
                        description: `${site_name} ID is required please contact support`,
                        variant: "destructive"
                    })
                }

                const { data, error } = await supabase
                    .from('connections')
                    .select('id, account_number, site_id')
                    .eq('paytype', -1)
                    .eq('is_active', true)
                    .eq('is_deleted', false)
                    .eq('site_id', user?.user_metadata?.site_id)
                    .order('account_number', { ascending: true })
                if (error) {
                    throw error;
                }
                setConnections(data || [])
            } catch (error) {
                console.error("Error loading connections:", error)
                toast({
                    title: "Error",
                    description: "Failed to load connections",
                    variant: "destructive"
                })
            } finally {
                setIsLoadingConnections(false)
            }
        }

        checkUserAccess()
        loadConnections()
    }, [toast, router,])

    // Fetch existing reading when connection and date change
    useEffect(() => {
        const fetchExistingReading = async () => {

            if (!formData.connection_id || !formData.reading_date) {
                setUploadedImages([])
                return
            }

            try {
                const response = await fetch(`/api/submeter-readings/${formData.connection_id}/${formData.reading_date}`)
                if (response.ok) {
                    const reading = await response.json()

                    // Convert existing snapshot_urls to UploadedImageData format
                    if (reading?.snapshot_urls && Array.isArray(reading.snapshot_urls)) {
                        const existingImages: UploadedImageData[] = reading.snapshot_urls.map((url: string, index: number) => ({
                            url,
                            filename: `existing-image-${index + 1}`,
                            image_type: 'existing',
                            extractedReading: ''
                        }))
                        setUploadedImages(existingImages)
                    } else {
                        setUploadedImages([])
                    }
                } else if (response.status === 404) {
                    // No existing reading found - only clear if we don't have any uploaded images
                    setUploadedImages([])
                } else {
                    setUploadedImages([])
                }
            } catch (error) {
                setUploadedImages([])
            }
        }

        fetchExistingReading()
    }, [formData])

    const handleImageUploaded = (imageData: UploadedImageData) => {
        setUploadedImages(prev => {
            // If it's a start or end reading, replace existing image of same type
            if (imageData.image_type === 'start' || imageData.image_type === 'end') {
                const filtered = prev.filter(img => img.image_type !== imageData.image_type)
                return [...filtered, imageData]
            }
            // For other types, just append (no overwriting)
            return [...prev, imageData]
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.connection_id || !formData.reading_date) {
            toast({
                title: "Missing Information",
                description: "Please provide connection ID and reading date",
                variant: "destructive"
            })
            return
        }

        if (uploadedImages.length === 0) {
            toast({
                title: "No Images",
                description: "Please upload at least one meter reading image",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            // Prepare the reading data
            const startImage = uploadedImages.find(img => img.image_type === 'start')
            const endImage = uploadedImages.find(img => img.image_type === 'end')

            const readingData = {
                connection_id: formData.connection_id,
                reading_date: formData.reading_date,
                start_reading: startImage?.extractedReading ? Number(startImage.extractedReading) : 0,
                end_reading: endImage?.extractedReading ? Number(endImage.extractedReading) : 0,
                snapshot_urls: uploadedImages.map(img => img.url)
            }

            // Submit to upsert endpoint
            const response = await fetch('/api/submeter-readings/upsert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(readingData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save reading')
            }

            toast({
                title: "Success",
                description: "Meter reading saved successfully!"
            })

            // Reset the form after successful submission
            resetForm()
        } catch (error) {
            toast({
                title: "Save Failed",
                description: error instanceof Error ? error.message : "Failed to save meter reading",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeImage = (imageUrl: string) => {
        setUploadedImages(prev => prev.filter(img => img.url !== imageUrl))
    }

    const resetForm = () => {
        setFormData({
            connection_id: "",
            reading_date: new Date().toISOString().slice(0, 10),
        })
        setUploadedImages([])
    }


    return (
        <div className="container mx-auto p-2 sm:p-6 max-w-4xl">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">Operator Access - Meter Reading Portal</h2>
                <p className="text-blue-700">Welcome! This is your dedicated workspace for meter reading uploads. Only operator users can access this page.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Connection & Date
                            </CardTitle>
                            <CardDescription>
                                Select the connection and reading date
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="connection_id">Meter Number</Label>
                                <Select
                                    value={formData.connection_id}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, connection_id: value }))}
                                    disabled={isLoadingConnections}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingConnections ? "Loading connections..." : "Select a connection"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <ScrollArea className="max-h-[250px]">
                                            {isLoadingConnections ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                                                        <span className="text-muted-foreground">Loading connections...</span>
                                                    </div>
                                                </div>
                                            ) : connections.length === 0 ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <span className="text-muted-foreground">No submeter connections found</span>
                                                </div>
                                            ) : (
                                                connections.map((connection) => (
                                                    <SelectItem key={connection.id} value={connection.id}>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="font-medium">{connection.account_number}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {connection.site_id}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reading_date">Reading Date</Label>
                                <Input
                                    id="reading_date"
                                    type="date"
                                    value={formData.reading_date}

                                    max={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reading_date: e.target.value }))}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Single Image Upload */}
                    {formData.connection_id && formData.reading_date && (
                        <SingleImageUpload
                            connectionId={formData.connection_id}
                            readingDate={formData.reading_date}
                            onImageUploaded={handleImageUploaded}
                        />
                    )}
                </div>

                {/* Summary Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Summary</CardTitle>
                            <CardDescription>
                                Review your uploaded images and readings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {uploadedImages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No images uploaded yet</p>
                                    <p className="text-sm">Upload images to see them here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {uploadedImages.map((image, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${image.image_type === 'start' ? 'bg-blue-500' :
                                                        image.image_type === 'end' ? 'bg-green-500' :
                                                            'bg-gray-500'
                                                        }`}></div>
                                                    <span className="font-medium capitalize">
                                                        {image.image_type === 'existing' ? 'Existing Image' : `${image.image_type} Reading`}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeImage(image.url)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            {image.extractedReading && (
                                                <div className="text-2xl font-mono font-bold text-gray-900">
                                                    {image.extractedReading}
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                <img src={image.url} alt="Meter reading" className="max-w-full h-auto rounded border" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <LoadingButton
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={uploadedImages.length === 0 || !formData.connection_id || !formData.reading_date}
                        className="w-full"
                    >
                        Save Meter Reading
                    </LoadingButton>
                </div>
            </div>
        </div>
    )
}
