"use client"

import { useEffect, useRef } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteDialog({ open, onClose, onConfirm }: DeleteDialogProps) {
  const deleteRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => deleteRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none",
            "w-[320px] rounded-xl bg-white p-6 shadow-xl",
            "transition-all duration-200"
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-[#171717]">
            Delete conversation?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-[#737373]">
            This action cannot be undone.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-[#F5F5F5] text-[#171717] hover:bg-[#E5E5E5]",
                "transition-colors duration-200 cursor-pointer"
              )}
            >
              Cancel
            </button>
            <button
              ref={deleteRef}
              onClick={() => { onConfirm(); onClose() }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
                "transition-colors duration-200 cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#DC2626]"
              )}
            >
              Delete
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
