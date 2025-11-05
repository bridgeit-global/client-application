"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, ImageIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Viewer, Worker } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import type React from "react" // Added import for React

export function ImageViewer({ imageUrl }: { imageUrl: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleImageLoad = () => setIsLoading(false)
  const handleImageError = () => {
    setIsLoading(false)
    setError("Failed to load image")
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = imageUrl.split("/").pop() || "image"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
    }
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  return (
    <div className="flex h-full flex-col space-y-4 bg-background p-2 text-foreground sm:p-4">
      <div className="flex space-x-2">
        <Button size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button size="sm" onClick={handleZoomIn}>
          <ZoomIn className="mr-2 h-4 w-4" />
          Zoom In
        </Button>
        <Button size="sm" onClick={handleZoomOut}>
          <ZoomOut className="mr-2 h-4 w-4" />
          Zoom Out
        </Button>
        <Button size="sm" onClick={handleRotate}>
          <RotateCw className="mr-2 h-4 w-4" />
          Rotate
        </Button>
      </div>
      <div className="relative flex-1 overflow-auto">
        {isLoading && <Skeleton className="absolute inset-0" />}
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-500">{error}</div>}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Viewer"
          className="mx-auto h-full object-contain"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease-in-out",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  )
}

export function PDFViewer({ pdfUrl }: { pdfUrl: string }) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin()
  return (
    <Worker workerUrl={"https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"}>
      <div className="mt-10 md:mt-4" style={{ height: "calc(100vh - 100px)" }}>
        <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
      </div>
    </Worker>
  )
}

export function HTMLViewer({ htmlUrl }: { htmlUrl: string }) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHtml = async () => {
      try {
        const response = await fetch(htmlUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch HTML")
        }
        const html = await response.text()
        setHtmlContent(html)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load HTML file")
        setIsLoading(false)
      }
    }

    fetchHtml()
  }, [htmlUrl])

  const handleDownload = async () => {
    try {
      const response = await fetch(htmlUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = htmlUrl.split("/").pop() || "document.html"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading HTML:", error)
    }
  }

  return (
    <div
      style={{ height: "calc(100vh - 100px)" }}
      className="items-center space-y-4 bg-background p-2 text-foreground sm:p-4"
    >
      <Button size="sm" onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <div className="w-full overflow-auto rounded-lg border" style={{ height: "calc(100vh - 120px)" }}>
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <iframe srcDoc={htmlContent} title="HTML Viewer" className="h-full w-full" sandbox="allow-scripts" />
        )}
      </div>
    </div>
  )
}

export default function DocumentViewerModal({
  documentUrl,
  contentType = "pdf",
  icon,
  label,
}: {
  documentUrl: string
  contentType?: string | undefined | null
  icon?: React.ReactNode
  label?: string
}) {
  const getIcon = () => {
    if (icon) return icon
    switch (contentType) {
      case "pdf":
        return <FileText />
      case "html":
        return <FileText />
      case "image":
        return <ImageIcon />
      default:
        return <FileText />
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer hover:text-blue-500" asChild>
        <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
          {getIcon()}
          {label || ""}
        </span>
      </DialogTrigger>
      <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2 sm:p-6">
        {documentUrl ? (
          contentType === "pdf" ? (
            <PDFViewer pdfUrl={documentUrl} />
          ) : contentType === "html" ? (
            <HTMLViewer htmlUrl={documentUrl} />
          ) : contentType === "image" ? (
            <ImageViewer imageUrl={documentUrl} />
          ) : (
            <div className="p-4">Unsupported content type</div>
          )
        ) : (
          <div className="p-4">No URL available</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

