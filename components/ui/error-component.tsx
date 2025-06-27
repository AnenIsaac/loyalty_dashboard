import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ErrorComponentProps {
  message: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorComponent({ message, onRetry, showRetry = true }: ErrorComponentProps) {
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="p-6 max-w-md w-full">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>
          {showRetry && onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
} 