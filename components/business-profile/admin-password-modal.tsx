import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AdminPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (password: string) => void
}

export function AdminPasswordModal({
  open,
  onOpenChange,
  onConfirm,
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onConfirm(password)
      setPassword("")
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Admin Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={error ? "border-red-500" : ""}
              placeholder="Enter admin password"
            />
            {error && (
              <p className="text-sm text-red-500">Please enter a password</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setPassword("")
                setError(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Confirm Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 