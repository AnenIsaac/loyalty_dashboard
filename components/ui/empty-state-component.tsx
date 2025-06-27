import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EmptyStateComponentProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export function EmptyStateComponent({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon 
}: EmptyStateComponentProps) {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="p-6 max-w-md w-full">
        <div className="flex flex-col items-center space-y-4 text-center">
          {icon || <FileText className="h-12 w-12 text-gray-400" />}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600">
              {description}
            </p>
          </div>
          {actionLabel && onAction && (
            <Button 
              onClick={onAction}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
} 