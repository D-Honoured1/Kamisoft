"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Archive } from "lucide-react"

interface DeleteClientDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  clientName: string
  isLoading?: boolean
}

export function DeleteClientDialog({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isLoading = false
}: DeleteClientDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    onConfirm(reason.trim() || "Archived by admin")
    setReason("")
  }

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-orange-600" />
            Archive Client
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                    This will archive the client: <strong>{clientName}</strong>
                  </p>
                  <ul className="text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Client will be hidden from the main client list</li>
                    <li>• All service requests and payments will be preserved</li>
                    <li>• Client data can be restored later if needed</li>
                    <li>• This action can be undone</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="archive-reason">
                  Reason for archiving (optional)
                </Label>
                <Textarea
                  id="archive-reason"
                  placeholder="Enter a reason for archiving this client..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive Client
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}