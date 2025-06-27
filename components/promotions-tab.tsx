import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PenLine, Trash2, Plus } from "lucide-react"
import { AddEditPromotionModal } from "./add-edit-promotion-modal"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Business } from "@/types/common"

interface Promotion {
  id: number
  created_at: string
  business_id: string
  title: string
  description: string
  image_url: string | null
  start_date: string | null
  end_date: string | null
  status: string
}

interface PromotionsTabProps {
  business?: Business
}

export function PromotionsTab({ business }: PromotionsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

    const loadPromotions = async () => {
    if (!business?.id) return

      try {
        setIsLoading(true)
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error loading promotions:", error)
        toast({
          title: "Error",
          description: "Failed to load promotions. Please try again later.",
          variant: "destructive",
        })
        return
      }

      setPromotions(data || [])
      } catch (error) {
        console.error("Failed to load promotions:", error)
        toast({
          title: "Error",
          description: "Failed to load promotions. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    loadPromotions()
  }, [business?.id])

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion)
    setIsModalOpen(true)
  }

  const handleAddNewPromotion = () => {
    setSelectedPromotion(null)
    setIsModalOpen(true)
  }

  const handleDeletePromotion = async (id: number) => {
    if (!business?.id) return

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
        .eq('business_id', business.id)

      if (error) {
        console.error("Error deleting promotion:", error)
        toast({
          title: "Error",
          description: "Failed to delete promotion. Please try again.",
          variant: "destructive",
        })
        return
      }

      setPromotions(promotions.filter(promo => promo.id !== id))
      toast({
        title: "Success",
        description: "Promotion deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete promotion:", error)
      toast({
        title: "Error",
        description: "Failed to delete promotion. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSavePromotion = async (formData: any) => {
    if (!business?.id) return

    try {
      if (selectedPromotion) {
        // Update existing promotion
        const { data, error } = await supabase
          .from('promotions')
          .update({
            title: formData.title,
          description: formData.description,
            image_url: formData.imageUrl,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            status: formData.status,
          })
          .eq('id', selectedPromotion.id)
          .eq('business_id', business.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating promotion:", error)
          toast({
            title: "Error",
            description: "Failed to update promotion. Please try again.",
            variant: "destructive",
        })
          return
        }
        
        setPromotions(promotions.map(p => p.id === data.id ? data : p))
        toast({
          title: "Success",
          description: "Promotion updated successfully.",
        })
      } else {
        // Create new promotion
        const { data, error } = await supabase
          .from('promotions')
          .insert({
            business_id: business.id,
            title: formData.title,
          description: formData.description,
            image_url: formData.imageUrl,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            status: formData.status,
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating promotion:", error)
          toast({
            title: "Error",
            description: "Failed to create promotion. Please try again.",
            variant: "destructive",
        })
          return
        }
        
        setPromotions([data, ...promotions])
        toast({
          title: "Success",
          description: "New promotion created successfully.",
        })
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to save promotion:", error)
      toast({
        title: "Error",
        description: "Failed to save promotion. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500"
      case "inactive":
        return "text-blue-500"
      case "expired":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Promotions Management</h2>
        <Button 
          onClick={handleAddNewPromotion}
          className="bg-[#F8843A] hover:bg-[#E77A35] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Promotion
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Plus className="h-12 w-12 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No promotions yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first promotion to engage customers and boost sales.
          </p>
          <Button 
            onClick={handleAddNewPromotion}
            className="bg-[#F8843A] hover:bg-[#E77A35] text-white"
          >
            Add New Promotion
          </Button>
        </div>
      ) : (
      <div className="space-y-4">
        {promotions.map((promotion) => (
          <div
            key={promotion.id}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border"
          >
              {promotion.image_url ? (
              <img
                  src={promotion.image_url}
                  alt={promotion.title}
                className="w-24 h-24 object-cover rounded"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium">{promotion.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{promotion.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPromotion(promotion)}
                    className="h-8 w-8"
                  >
                    <PenLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDeletePromotion(promotion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span className={getStatusColor(promotion.status)}>
                    {promotion.status?.charAt(0).toUpperCase() + promotion.status?.slice(1)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Start: </span>
                  <span>{formatDate(promotion.start_date)}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">End: </span>
                  <span>{formatDate(promotion.end_date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <AddEditPromotionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        business={business}
        promotion={selectedPromotion ? {
          id: selectedPromotion.id.toString(),
          title: selectedPromotion.title,
          description: selectedPromotion.description,
          imageUrl: selectedPromotion.image_url,
          startDate: selectedPromotion.start_date,
          endDate: selectedPromotion.end_date,
          status: selectedPromotion.status as "active" | "inactive" | "expired",
        } : null}
        onSave={handleSavePromotion}
      />
    </div>
  )
} 