"use client"

import { useState, useEffect, useRef } from "react"
import { X, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Promotion {
  id: string
  title: string
  description: string
  imageUrl: string | null
  startDate: string | null
  endDate: string | null
  status: "active" | "inactive" | "expired"
}

interface Business {
  id: string
}

interface AddEditPromotionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business?: Business
  promotion?: Promotion | null
  onSave: (formData: any) => void
}

export function AddEditPromotionModal({ 
  open, 
  onOpenChange, 
  business,
  promotion, 
  onSave 
}: AddEditPromotionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    status: "active" as "active" | "inactive" | "expired"
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || "",
        description: promotion.description || "",
        imageUrl: promotion.imageUrl || "",
        startDate: promotion.startDate || "",
        endDate: promotion.endDate || "",
        status: promotion.status || "active"
      })
      setImagePreview(promotion.imageUrl || "")
    } else {
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
        status: "active"
      })
      setImagePreview("")
    }
    setSelectedImage(null)
  }, [promotion, open])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!business?.id) return null

    try {
      setIsUploading(true)
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${business.id}/promotions/${fileName}`

      const { data, error } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading image:', error)
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a promotion title.",
        variant: "destructive",
      })
      return
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a promotion description.",
        variant: "destructive",
      })
      return
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast({
          title: "Validation Error",
          description: "End date must be after start date.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setIsSaving(true)
      let imageUrl = formData.imageUrl

      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          return // Upload failed, don't continue
        }
      }

      await onSave({
        ...formData,
        imageUrl: imageUrl || null
      })

    } catch (error) {
      console.error('Error saving promotion:', error)
      toast({
        title: "Error",
        description: "Failed to save promotion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview("")
    setFormData(prev => ({ ...prev, imageUrl: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Edit Promotion" : "Add New Promotion"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
              Promotion Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter promotion title"
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your promotion..."
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-[80px]"
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {(formData.description || "").length}/200 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Promotion Image
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Click to upload an image or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
              Status
            </Label>
            <Select
              value={formData.status || "active"}
              onValueChange={(value: "active" | "inactive" | "expired") => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="px-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            className="bg-[#F8843A] hover:bg-[#E77A35] text-white"
          >
            {isSaving || isUploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isUploading ? "Uploading..." : "Saving..."}
              </div>
            ) : (
              promotion ? "Update Promotion" : "Create Promotion"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
