import { Loader2 } from "lucide-react"

interface LoadingComponentProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingComponent({ message = "Loading...", size = "md" }: LoadingComponentProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[#F8843A]`} />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </div>
  )
} 