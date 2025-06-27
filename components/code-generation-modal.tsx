import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { QrCode } from "lucide-react"

interface CodeGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reward: {
    id: string
    name: string
  } | null
  onGenerate: (rewardId: string, quantity: number) => Promise<void>
  isGenerating: boolean
  businessName: string
}

export function CodeGenerationModal({
  open,
  onOpenChange,
  reward,
  onGenerate,
  isGenerating,
  businessName
}: CodeGenerationModalProps) {
  const [quantity, setQuantity] = useState(10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reward) return

    await onGenerate(reward.id, quantity)
    onOpenChange(false)
    setQuantity(10) // Reset to default
  }

  const generateRewardCode = (rewardName: string): string => {
    if (!rewardName) return 'RWD'
    
    // Remove common prefixes and clean the name
    let cleanName = rewardName.trim()
    
    // Remove common prefixes (case insensitive)
    const prefixesToRemove = ['free', 'get', 'win', 'buy', 'purchase']
    for (const prefix of prefixesToRemove) {
      const regex = new RegExp(`^${prefix}\\s+`, 'i')
      cleanName = cleanName.replace(regex, '')
    }
    
    // Remove numbers, percentages, and special characters from the beginning
    cleanName = cleanName.replace(/^[0-9%\s\-\+\*\/\(\)\[\]\{\}\.,:;!@#$%^&*]+/, '')
    
    // Split into words and find the first meaningful word
    const words = cleanName.split(/\s+/).filter(word => {
      // Remove empty words and words that are just numbers/symbols
      return word.length > 0 && /[a-zA-Z]/.test(word)
    })
    
    let meaningfulWord = ''
    if (words.length > 0) {
      // Take the first meaningful word
      meaningfulWord = words[0]
    } else {
      // Fallback: use the original reward name if no meaningful word found
      meaningfulWord = rewardName
    }
    
    // Extract first 3 letters (only alphabetic characters)
    const letters = meaningfulWord.replace(/[^A-Za-z]/g, '').toUpperCase()
    const code = letters.slice(0, 3).padEnd(3, 'X') // Pad with 'X' if less than 3 letters
    
    return code
  }

  const generatePreviewCode = () => {
    const rewardCode = generateRewardCode(reward?.name || '')
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateCode = month + day
    return `${rewardCode}${dateCode}001`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Reward Codes
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Reward</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded-md">
              <p className="font-medium">{reward?.name}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="quantity" className="text-sm font-medium">
              Number of Codes to Generate
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate between 1 and 100 codes at a time
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Code Format Preview</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded-md font-mono text-sm">
              {generatePreviewCode()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Format: {generateRewardCode(reward?.name || '')}MMDDXXX
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating || !reward}
              className="bg-[#F8843A] hover:bg-[#E77A35] text-white"
            >
              {isGenerating ? "Generating..." : `Generate ${quantity} Codes`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 