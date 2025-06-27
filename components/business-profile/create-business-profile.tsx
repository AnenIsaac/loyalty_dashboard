'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CreateBusinessProfileProps {
  userId: string
  onSuccess?: () => void
}

export function CreateBusinessProfile({ userId, onSuccess }: CreateBusinessProfileProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_description: '',
    phone_number: '',
    email: '',
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone_number || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          user_id: userId,
          name: formData.name,
          description: formData.description,
          location_description: formData.location_description,
          phone_number: formData.phone_number,
          email: formData.email,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Business profile created successfully!",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/reports')
      }
    } catch (error) {
      console.error('Error creating business:', error)
      toast({
        title: "Error",
        description: "Failed to create business profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create Business Profile</h2>
        <p className="text-muted-foreground">Set up your business information to get started</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter business name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Business Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter business email"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tell us about your business"
            rows={4}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location_description">Location Description</Label>
          <Textarea
            id="location_description"
            name="location_description"
            value={formData.location_description}
            onChange={handleInputChange}
            placeholder="Describe your business location"
            rows={2}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
