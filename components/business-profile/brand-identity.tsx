import { useState, useEffect, useCallback, useMemo } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { Upload, X, Image as ImageIcon, Palette, Loader2, Instagram, MessageCircle, Twitter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { validateWhatsApp } from "@/utils/validation"

// 2. TypeScript Interfaces
interface BrandFormData {
  logo_url?: string
  cover_image_url?: string
  instagram?: string
  whatsapp?: string
  x?: string
  tiktok?: string
  carousel_images?: string[]
}

interface BrandIdentityProps {
  userId: string
  businessId: string
  onUpdate?: () => void
}

interface ValidationErrors {
  [key: string]: string
}

interface LoadingState {
  isLoading: boolean
  isSaving: boolean
  isUploading: boolean
}

interface PendingFiles {
  logo?: File | null
  cover?: File | null
  carousel?: File[]
}

// 3. Main Component
export function BrandIdentity({ userId, businessId, onUpdate }: BrandIdentityProps) {
  // SECTION 1: State and Data Fetching
  const [formData, setFormData] = useState<BrandFormData>({
    logo_url: '',
    cover_image_url: '',
    instagram: '',
    whatsapp: '',
    x: '',
    tiktok: '',
    carousel_images: [],
  })
  
  const [originalData, setOriginalData] = useState<BrandFormData | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFiles>({
    logo: null,
    cover: null,
    carousel: []
  })
  const [previewUrls, setPreviewUrls] = useState<{
    logo?: string
    cover?: string
    carousel?: string[]
  }>({})
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isSaving: false,
    isUploading: false
  })
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const hasChanges = useMemo(() => {
    if (!originalData) return false
    
    // Check for pending files (new uploads)
    if (pendingFiles.logo || pendingFiles.cover || (pendingFiles.carousel && pendingFiles.carousel.length > 0)) {
      return true
    }
    
    // Special handling for arrays
    const formCarousel = Array.isArray(formData.carousel_images) ? formData.carousel_images : []
    const originalCarousel = Array.isArray(originalData.carousel_images) ? originalData.carousel_images : []
    
    // Check if carousel images have changed
    if (formCarousel.length !== originalCarousel.length || 
        !formCarousel.every((url, index) => url === originalCarousel[index])) {
      return true
    }
    
    // Check other fields
    return Object.keys(formData).some(key => {
      if (key === 'carousel_images') return false // Already checked above
      return formData[key as keyof BrandFormData] !== originalData[key as keyof BrandFormData]
    })
  }, [formData, originalData, pendingFiles])

  const fetchBrandData = useCallback(async () => {
    if (!userId) {
      setError('User ID is required')
      setLoadingState(prev => ({ ...prev, isLoading: false }))
      return
    }

    if (!businessId) {
      setError('Business ID is required')
      setLoadingState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }))
      setError('')

      console.log('Fetching brand data for business ID:', businessId)

      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('logo_url, cover_image_url, instagram, whatsapp, x, tiktok, carousel_images')
        .eq('id', businessId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No business found, set empty defaults
          const emptyData: BrandFormData = {
            logo_url: '',
            cover_image_url: '',
            instagram: '',
            whatsapp: '',
            x: '',
            tiktok: '',
            carousel_images: [],
          }
          setFormData(emptyData)
          setOriginalData(emptyData)
        } else {
          throw fetchError
        }
      } else {
        // Helper function to safely parse carousel images
        const parseCarouselImages = (carouselData: any): string[] => {
          if (!carouselData) return []
          
          // If it's already an array, return it
          if (Array.isArray(carouselData)) {
            return carouselData.filter(url => typeof url === 'string' && url.trim().length > 0)
          }
          
          // If it's a string, try to parse it as JSON
          if (typeof carouselData === 'string') {
            try {
              const parsed = JSON.parse(carouselData)
              if (Array.isArray(parsed)) {
                return parsed.filter(url => typeof url === 'string' && url.trim().length > 0)
              }
            } catch (e) {
              console.warn('Failed to parse carousel_images as JSON:', carouselData)
            }
          }
          
          return []
        }
        
        const brandData: BrandFormData = {
          logo_url: business.logo_url || '',
          cover_image_url: business.cover_image_url || '',
          instagram: business.instagram || '',
          whatsapp: business.whatsapp || '',
          x: business.x || '',
          tiktok: business.tiktok || '',
          carousel_images: parseCarouselImages(business.carousel_images),
        }
        
        console.log('Fetched business data:', business)
        console.log('Processed carousel images:', brandData.carousel_images)
        
        setFormData(brandData)
        setOriginalData(brandData)
      }
    } catch (err) {
      console.error('Error fetching brand data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load brand information')
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }))
    }
  }, [userId, businessId, supabase])

  const uploadFile = useCallback(async (file: File, folder: string): Promise<string> => {
    if (!file) {
      throw new Error('No file provided for upload')
    }
    
    if (!businessId) {
      throw new Error('Business ID is required for file upload')
    }
    
    if (!folder) {
      throw new Error('Folder name is required for file upload')
    }
    
    console.log(`Uploading file: ${file.name} (${file.size} bytes) to ${folder}`)
    
    const fileExt = file.name.split('.').pop()
    if (!fileExt) {
      throw new Error('File must have an extension')
    }
    
    const fileName = `${businessId}/${folder}/${Date.now()}.${fileExt}`
    console.log(`File path: ${fileName}`)
    
    try {
      // Validate file before upload
      console.log('File validation:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })

      if (file.size === 0) {
        throw new Error('File is empty. Please select a valid image file.')
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File is too large. Please select a file smaller than 10MB.')
      }

      console.log('Starting upload for file:', fileName)
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const { data, error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      console.log('Raw upload response:')
      console.log('- data:', data)
      console.log('- error:', uploadError)
      console.log('- data type:', typeof data)
      console.log('- error type:', typeof uploadError)
      console.log('- data keys:', data ? Object.keys(data) : 'null')
      console.log('- error keys:', uploadError ? Object.keys(uploadError) : 'null')

      // Check for successful upload first
      if (data && data.path) {
        console.log('Upload successful, getting public URL for:', data.path)
        
        const { data: urlData } = supabase.storage
          .from('business-assets')
          .getPublicUrl(data.path)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file')
        }

        console.log('Public URL generated:', urlData.publicUrl)
        return urlData.publicUrl
      }

      // Only handle errors if upload actually failed (no data returned)
      if (uploadError && !data) {
        console.error('Supabase upload error:', uploadError)
        console.error('Upload error details:', uploadError)
        
        // Provide error message
        if (uploadError.message) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        } else {
          throw new Error('Upload failed with unknown error. Please check your network connection and try again.')
        }
      }

      // If we get here, something unexpected happened
      throw new Error('Upload completed but no data or clear error returned')
    } catch (storageError) {
      console.error('Storage operation failed:', storageError)
      throw storageError
    }
  }, [businessId, supabase])

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    // Social media URL validation (optional fields)
    if (formData.instagram && !formData.instagram.match(/^@?[\w.]+$/)) {
      errors.instagram = 'Please enter a valid Instagram username'
    }
    
    if (formData.whatsapp && !validateWhatsApp(formData.whatsapp)) {
      errors.whatsapp = 'Please enter a valid WhatsApp number (e.g., +255750454666) or username (e.g., @username)'
    }
    
    if (formData.x && !formData.x.match(/^@?[\w]+$/)) {
      errors.x = 'Please enter a valid X (Twitter) username'
    }
    
    if (formData.tiktok && !formData.tiktok.match(/^@?[\w.]+$/)) {
      errors.tiktok = 'Please enter a valid TikTok username'
    }

    return errors
  }, [formData])

  const handleSave = useCallback(async () => {
    console.log('🚀 HANDLE SAVE CALLED!')
    console.log('Form data at start of save:', formData)
    console.log('Pending files:', pendingFiles)
    console.log('Business ID:', businessId)
    
    const errors = validateForm()
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before saving.",
        variant: "destructive",
      })
      return
    }

    // Check if businessId is available and valid
    if (!businessId || businessId.trim() === '' || businessId === 'middleware-verified') {
      console.error('Invalid businessId for saving:', businessId)
      toast({
        title: "Error", 
        description: "Invalid business ID. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    console.log('Starting save process with businessId:', businessId)
    console.log('Current form data:', formData)
    console.log('Pending files:', pendingFiles)
    
    // First, verify the business exists and belongs to the current user
    try {
      console.log('Verifying business ownership...')
      console.log('Business ID:', businessId)
      console.log('User ID:', userId)
      
      const { data: businessCheck, error: checkError } = await supabase
        .from('businesses')
        .select('id, user_id')
        .eq('id', businessId)
        .single()
      
      console.log('Business check result:', businessCheck)
      console.log('Business check error:', checkError)
      
      if (checkError || !businessCheck) {
        console.error('Business not found:', checkError)
        toast({
          title: "Error",
          description: "Business not found. Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }
      
      if (businessCheck.user_id !== userId) {
        console.error('Business ownership mismatch:', {
          businessUserId: businessCheck.user_id,
          currentUserId: userId
        })
        toast({
          title: "Error",
          description: "You don't have permission to modify this business.",
          variant: "destructive",
        })
        return
      }
      
      console.log('Business ownership verified successfully')
    } catch (checkErr) {
      console.error('Error checking business existence:', checkErr)
      toast({
        title: "Error",
        description: "Could not verify business. Please try again.",
        variant: "destructive",
      })
      return
    }
    
    setLoadingState(prev => ({ ...prev, isSaving: true }))
    
    try {
      let updatedFormData = { ...formData }
      
      // Upload pending files with detailed error handling
      if (pendingFiles.logo) {
        console.log('Uploading logo...')
        try {
          const logoUrl = await uploadFile(pendingFiles.logo, 'logos')
          updatedFormData.logo_url = logoUrl
          console.log('Logo uploaded successfully:', logoUrl)
        } catch (logoError) {
          console.error('Logo upload failed:', logoError)
          const errorMessage = logoError instanceof Error ? logoError.message : 'Unknown error'
          throw new Error(`Logo upload failed: ${errorMessage}`)
        }
      }
      
      if (pendingFiles.cover) {
        console.log('Uploading cover image...')
        try {
          const coverUrl = await uploadFile(pendingFiles.cover, 'covers')
          updatedFormData.cover_image_url = coverUrl
          console.log('Cover uploaded successfully:', coverUrl)
        } catch (coverError) {
          console.error('Cover upload failed:', coverError)
          const errorMessage = coverError instanceof Error ? coverError.message : 'Unknown error'
          throw new Error(`Cover upload failed: ${errorMessage}`)
        }
      }
      
      if (pendingFiles.carousel && pendingFiles.carousel.length > 0) {
        console.log('Uploading carousel images...')
        try {
          const uploadPromises = pendingFiles.carousel.map((file, index) => {
            console.log(`Uploading carousel image ${index + 1}...`)
            return uploadFile(file, 'carousel')
          })
          const uploadedUrls = await Promise.all(uploadPromises)
          const existingCarousel = Array.isArray(updatedFormData.carousel_images) ? updatedFormData.carousel_images : []
          updatedFormData.carousel_images = [...existingCarousel, ...uploadedUrls]
          console.log('Carousel images uploaded successfully:', uploadedUrls)
        } catch (carouselError) {
          console.error('Carousel upload failed:', carouselError)
          const errorMessage = carouselError instanceof Error ? carouselError.message : 'Unknown error'
          throw new Error(`Carousel upload failed: ${errorMessage}`)
        }
      }
      
      console.log('Final form data to save:', updatedFormData)
      
      // ALWAYS send ALL fields to database, including blank/empty values
      // This ensures the database is updated with the current form state
      const brandData = {
        logo_url: updatedFormData.logo_url?.trim() || null,
        cover_image_url: updatedFormData.cover_image_url?.trim() || null,
        instagram: updatedFormData.instagram?.trim() || null,
        whatsapp: updatedFormData.whatsapp?.trim() || null,
        x: updatedFormData.x?.trim() || null,
        tiktok: updatedFormData.tiktok?.trim() || null,
        carousel_images: Array.isArray(updatedFormData.carousel_images) ? updatedFormData.carousel_images : [],
      }

      console.log('Sending ALL brand data to database:', brandData)
      console.log('Updating business with ID:', businessId)
      console.log('Supabase client:', !!supabase)

      const { data: updateResult, error: updateError } = await supabase
        .from('businesses')
        .update(brandData)
        .eq('id', businessId)
        .select()

      console.log('Raw Supabase response:', { data: updateResult, error: updateError })

      if (updateError) {
        console.error('Database update failed:', updateError)
        console.error('Update error details:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        })
        throw new Error(`Database update failed: ${updateError.message}`)
      }
      
      if (!updateResult || updateResult.length === 0) {
        console.error('Update succeeded but no rows were affected')
        console.error('This might mean the businessId does not exist:', businessId)
        throw new Error('No business record was updated. Please check if the business exists.')
      }
      
      console.log('Database updated successfully')
      console.log('Update result:', updateResult)
      console.log('Updated business data:', updateResult[0])
      
      // Update form data with new URLs and clear pending files
      setFormData(updatedFormData)
      setOriginalData({ ...updatedFormData })
      setPendingFiles({ logo: null, cover: null, carousel: [] })
      setPreviewUrls({})
      
      toast({
        title: "Success",
        description: "Brand identity saved successfully!",
      })
      
      if (onUpdate) {
        onUpdate()
      }
      
    } catch (err) {
      console.error('Error saving brand data:', err)
      
      // Better error message handling
      let errorMessage = "Failed to save brand identity"
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err)
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isSaving: false }))
    }
  }, [formData, pendingFiles, businessId, validateForm, supabase, toast, onUpdate, uploadFile])

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }, [validationErrors])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔥 FORM SUBMITTED! handleSubmit called')
    console.log('Current form data:', formData)
    console.log('Business ID:', businessId)
    console.log('Is saving:', loadingState.isSaving)
    handleSave()
  }, [handleSave, formData, businessId, loadingState.isSaving])

  const handleRetry = useCallback(() => {
    fetchBrandData()
  }, [fetchBrandData])

  const handleReset = useCallback(() => {
    if (originalData) {
      setFormData({ ...originalData })
      setValidationErrors({})
      setPendingFiles({ logo: null, cover: null, carousel: [] })
      setPreviewUrls({})
  }
  }, [originalData])

  // File upload handlers
  const onLogoDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    // Store file for later upload
    setPendingFiles(prev => ({ ...prev, logo: file }))
    setPreviewUrls(prev => ({ ...prev, logo: previewUrl }))
    
    toast({
      title: "Logo Ready",
      description: "Logo will be uploaded when you save.",
    })
  }, [toast])

  const onCoverDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    // Store file for later upload
    setPendingFiles(prev => ({ ...prev, cover: file }))
    setPreviewUrls(prev => ({ ...prev, cover: previewUrl }))
    
    toast({
      title: "Cover Image Ready",
      description: "Cover image will be uploaded when you save.",
    })
  }, [toast])

  const onCarouselDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Create preview URLs
    const newPreviewUrls = acceptedFiles.map(file => URL.createObjectURL(file))
    
    // Store files for later upload
    setPendingFiles(prev => ({
      ...prev,
      carousel: [...(prev.carousel || []), ...acceptedFiles]
    }))
    
    setPreviewUrls(prev => ({
      ...prev,
      carousel: [...(prev.carousel || []), ...newPreviewUrls]
    }))
    
    toast({
      title: "Images Ready",
      description: `${acceptedFiles.length} image(s) will be uploaded when you save.`,
    })
  }, [toast])

  const removeCarouselImage = useCallback((index: number) => {
    const existingImages = Array.isArray(formData.carousel_images) ? formData.carousel_images : []
    const pendingImages = Array.isArray(previewUrls.carousel) ? previewUrls.carousel : []
    const totalExisting = existingImages.length
    
    if (index < totalExisting) {
      // Remove from existing saved images
      setFormData(prev => ({
        ...prev,
        carousel_images: existingImages.filter((_, i) => i !== index)
      }))
    } else {
      // Remove from pending images
      const pendingIndex = index - totalExisting
      setPendingFiles(prev => ({
        ...prev,
        carousel: (prev.carousel || []).filter((_, i) => i !== pendingIndex)
      }))
      setPreviewUrls(prev => ({
      ...prev,
        carousel: pendingImages.filter((_, i) => i !== pendingIndex)
      }))
    }
  }, [formData.carousel_images, previewUrls.carousel])

  const removeLogo = useCallback(() => {
    if (pendingFiles.logo) {
      // Remove pending logo
      setPendingFiles(prev => ({ ...prev, logo: null }))
      setPreviewUrls(prev => ({ ...prev, logo: undefined }))
    } else {
      // Remove existing logo
      setFormData(prev => ({ ...prev, logo_url: '' }))
    }
  }, [pendingFiles.logo])

  const removeCover = useCallback(() => {
    if (pendingFiles.cover) {
      // Remove pending cover
      setPendingFiles(prev => ({ ...prev, cover: null }))
      setPreviewUrls(prev => ({ ...prev, cover: undefined }))
    } else {
      // Remove existing cover
      setFormData(prev => ({ ...prev, cover_image_url: '' }))
  }
  }, [pendingFiles.cover])

  const {
    getRootProps: getLogoRootProps,
    getInputProps: getLogoInputProps,
    isDragActive: isLogoDragActive,
  } = useDropzone({
    onDrop: onLogoDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    disabled: loadingState.isSaving
  })

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive,
  } = useDropzone({
    onDrop: onCoverDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit for cover images
    disabled: loadingState.isSaving
  })

  const {
    getRootProps: getCarouselRootProps,
    getInputProps: getCarouselInputProps,
    isDragActive: isCarouselDragActive,
  } = useDropzone({
    onDrop: onCarouselDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    maxSize: 8 * 1024 * 1024, // 8MB limit per carousel image
    disabled: loadingState.isSaving
  })

  // Note: Storage access test removed as it was generating false warnings
  // The bucket listing operation returns empty arrays due to permissions,
  // but actual file uploads work correctly

  useEffect(() => {
    console.log('BrandIdentity component mounted with:', { userId, businessId })
    console.log('Business ID type:', typeof businessId, 'Value:', businessId)
    
    if (!userId) {
      setError('User ID is required')
      setLoadingState(prev => ({ ...prev, isLoading: false }))
      return
    }
    
    if (!businessId) {
      setError('Business ID is required for file uploads. Please ensure your business is properly set up.')
      setLoadingState(prev => ({ ...prev, isLoading: false }))
      return
    }
    
    // Fetch brand data on component mount
    fetchBrandData()
  }, [fetchBrandData, userId, businessId])

  // SECTION 2: Loading and Error States
  if (loadingState.isLoading) {
    return <LoadingComponent message="Loading brand identity..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error}
        onRetry={handleRetry}
      />
    )
  }

  // SECTION 3: Main Render
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Palette className="h-6 w-6 text-[#F8843A]" />
          <h2 className="text-2xl font-bold text-gray-900">Brand Identity</h2>
        </div>
        <p className="text-gray-600">
          Upload your business logo, cover image, and add social media links
        </p>
      </div>
      
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Logo Upload */}
        <div className="space-y-4">
            <Label className="flex items-center space-x-1">
              <ImageIcon className="h-4 w-4" />
              <span>Business Logo</span>
            </Label>
          <div
            {...getLogoRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isLogoDragActive ? "border-[#F8843A] bg-orange-50" : "border-gray-300 hover:border-[#F8843A]"}
                ${loadingState.isSaving ? "opacity-50 cursor-not-allowed" : ""}
                ${formData.logo_url ? "h-[200px]" : "h-[120px]"}`}
          >
            <input {...getLogoInputProps()} />
              {formData.logo_url || previewUrls.logo ? (
              <div className="relative h-full">
                <img
                    src={previewUrls.logo || formData.logo_url}
                  alt="Business logo"
                    className="h-full mx-auto object-contain rounded"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 text-gray-500 hover:text-red-500"
                    onClick={removeLogo}
                    disabled={loadingState.isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                  {loadingState.isSaving ? (
                    <>
                      <Loader2 className="h-8 w-8 text-[#F8843A] animate-spin mb-2" />
                      <p className="text-sm text-gray-500">Saving logo...</p>
                    </>
                  ) : (
                    <>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isLogoDragActive
                    ? "Drop the logo here"
                    : "Drag and drop logo here, or click to select"}
                </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>

          {/* Cover Image Upload */}
        <div className="space-y-4">
            <Label className="flex items-center space-x-1">
              <ImageIcon className="h-4 w-4" />
              <span>Cover Image</span>
            </Label>
          <div
            {...getCoverRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isCoverDragActive ? "border-[#F8843A] bg-orange-50" : "border-gray-300 hover:border-[#F8843A]"}
                ${loadingState.isSaving ? "opacity-50 cursor-not-allowed" : ""}
                ${formData.cover_image_url ? "h-[200px]" : "h-[120px]"}`}
          >
            <input {...getCoverInputProps()} />
              {formData.cover_image_url || previewUrls.cover ? (
              <div className="relative h-full">
                <img
                    src={previewUrls.cover || formData.cover_image_url}
                  alt="Cover image"
                  className="h-full w-full object-cover rounded"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 text-gray-500 hover:text-red-500"
                    onClick={removeCover}
                    disabled={loadingState.isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                  {loadingState.isSaving ? (
                    <>
                      <Loader2 className="h-8 w-8 text-[#F8843A] animate-spin mb-2" />
                      <p className="text-sm text-gray-500">Saving cover...</p>
                    </>
                  ) : (
                    <>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {isCoverDragActive
                    ? "Drop the cover image here"
                    : "Drag and drop cover image here, or click to select"}
                </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <Label>Social Media Links (Optional)</Label>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center space-x-1">
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </Label>
                <Input
                  id="instagram"
                  name="instagram"
                  value={formData.instagram || ''}
                  onChange={handleInputChange}
                  placeholder="@username"
                  disabled={loadingState.isSaving}
                  className={validationErrors.instagram ? 'border-red-500' : ''}
                />
                {validationErrors.instagram && (
                  <p className="text-sm text-red-600">{validationErrors.instagram}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={handleInputChange}
                  placeholder="phone number or username"
                  disabled={loadingState.isSaving}
                  className={validationErrors.whatsapp ? 'border-red-500' : ''}
                />
                {validationErrors.whatsapp && (
                  <p className="text-sm text-red-600">{validationErrors.whatsapp}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="x" className="flex items-center space-x-1">
                  <Twitter className="h-4 w-4" />
                  <span>X (Twitter)</span>
                </Label>
                <Input
                  id="x"
                  name="x"
                  value={formData.x || ''}
                  onChange={handleInputChange}
                  placeholder="@username"
                  disabled={loadingState.isSaving}
                  className={validationErrors.x ? 'border-red-500' : ''}
                />
                {validationErrors.x && (
                  <p className="text-sm text-red-600">{validationErrors.x}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok" className="flex items-center space-x-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>TikTok</span>
                </Label>
                <Input
                  id="tiktok"
                  name="tiktok"
                  value={formData.tiktok || ''}
                  onChange={handleInputChange}
                  placeholder="@username"
                  disabled={loadingState.isSaving}
                  className={validationErrors.tiktok ? 'border-red-500' : ''}
                />
                {validationErrors.tiktok && (
                  <p className="text-sm text-red-600">{validationErrors.tiktok}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Carousel Images Upload */}
      <div className="space-y-4">
          <Label>Business Image Gallery (Optional)</Label>
          <p className="text-sm text-gray-500 mb-4">
            Upload multiple images showcasing your business for customers to see in the app
          </p>
          
        <div
          {...getCarouselRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isCarouselDragActive ? "border-[#F8843A] bg-orange-50" : "border-gray-300 hover:border-[#F8843A]"}
              ${loadingState.isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getCarouselInputProps()} />
          <div className="flex flex-col items-center justify-center py-4">
              {loadingState.isSaving ? (
                <>
                  <Loader2 className="h-8 w-8 text-[#F8843A] animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Saving images...</p>
                </>
              ) : (
                <>
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              {isCarouselDragActive
                ? "Drop the images here"
                : "Drag and drop images here, or click to select"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WEBP up to 8MB each (multiple files)
            </p>
                </>
              )}
            </div>
          </div>

          {/* Display uploaded carousel images */}
          {(() => {
            const hasExisting = formData.carousel_images && Array.isArray(formData.carousel_images) && formData.carousel_images.length > 0
            const hasPending = previewUrls.carousel && previewUrls.carousel.length > 0
            
            return (hasExisting || hasPending)
          })() && (
            <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3 lg:grid-cols-4">
              {/* Existing saved images */}
              {Array.isArray(formData.carousel_images) && formData.carousel_images.map((imageUrl, index) => (
                <Card key={`existing-${index}`} className="relative group overflow-hidden">
                <img
                    src={imageUrl}
                    alt={`Business image ${index + 1}`}
                    className="w-full h-32 object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                    className="absolute top-1 right-1 text-white bg-black bg-opacity-50 hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCarouselImage(index)}
                    disabled={loadingState.isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
              
              {/* Pending preview images */}
              {Array.isArray(previewUrls.carousel) && previewUrls.carousel.map((previewUrl, index) => {
                const actualIndex = (formData.carousel_images?.length || 0) + index
                return (
                  <Card key={`pending-${index}`} className="relative group overflow-hidden border-2 border-orange-200">
                    <img
                      src={previewUrl}
                      alt={`New business image ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 text-white bg-black bg-opacity-50 hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeCarouselImage(actualIndex)}
                      disabled={loadingState.isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                      New
                    </div>
                  </Card>
                )
              })}
          </div>
        )}
      </div>

        <div className="flex justify-between pt-4 border-t">
          <div>
            {hasChanges && originalData && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={loadingState.isSaving}
              >
                Reset Changes
              </Button>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={loadingState.isSaving || !hasChanges}
            className="bg-[#F8843A] hover:bg-orange-500"
          >
            {loadingState.isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
      </div>
  )
} 