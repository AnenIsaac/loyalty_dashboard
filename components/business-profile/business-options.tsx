import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BusinessOptionsProps {
  userId: string
  businessId: string
  onUpdate?: () => void
}

export function BusinessOptions({ userId, businessId, onUpdate }: BusinessOptionsProps) {
  const handleOptionsUpdate = () => {
    // TODO: Implement business options functionality
    console.log('Business options updated for business:', businessId)
    if (onUpdate) {
      onUpdate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Settings2 className="h-6 w-6 text-[#F8843A]" />
          <h2 className="text-2xl font-bold text-gray-900">Business Options</h2>
        </div>
        <p className="text-gray-600">
          Configure advanced settings and options for your business
        </p>
      </div>

      <div className="text-center py-12">
        <Settings2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Advanced Options
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This section will include advanced business settings, integrations, 
          and configuration options for your loyalty program.
        </p>
        <Button 
          onClick={handleOptionsUpdate}
          className="bg-[#F8843A] hover:bg-orange-500"
        >
          Coming Soon
        </Button>
      </div>
    </div>
  )
} 