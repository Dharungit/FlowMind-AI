"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[320px] rounded-xl bg-white p-6 shadow-xl",
            "transition-all duration-200"
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-[#171717]">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-[#737373]">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-[#F5F5F5] text-[#171717] hover:bg-[#E5E5E5]",
                "transition-colors duration-200 cursor-pointer"
              )}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onClose() }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "transition-colors duration-200 cursor-pointer",
                destructive
                  ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                  : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
