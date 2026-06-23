"use client"

import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { RotateCw } from "lucide-react"
import { useMemoryContext } from "../store/MemoryContext"
import { useMemoriesQuery, useDeleteMemoryMutation } from "../hooks/use-memory"
import { MemoryList } from "./MemoryList"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { cn } from "@/lib/utils"

function getPercentageColor(percentage: number): string {
  if (percentage >= 80) return "text-[#DC2626]"
  if (percentage >= 50) return "text-[#CA8A04]"
  return "text-[#16A34A]"
}

interface MemoryModalProps {
  open: boolean
  onClose: () => void
}

export function MemoryModal({ open, onClose }: MemoryModalProps) {
  const { state } = useMemoryContext()
  const { data, isLoading, isRefetching, refetch } = useMemoriesQuery()
  const deleteMemory = useDeleteMemoryMutation()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const memories = data?.memories ?? []
  const percentage = Math.round(state.percentage * 100)

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteMemory.mutate(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(open) => { if (!open) onClose() }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200" />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none",
              "w-[680px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-32px)]",
              "rounded-xl bg-white shadow-xl",
              "flex flex-col overflow-hidden",
              "transition-all duration-200"
            )}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
              <Dialog.Title className="text-base font-semibold text-neutral-900">
                Memory
              </Dialog.Title>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
                  "transition-colors duration-200 cursor-pointer",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:ring-2 focus-visible:ring-[#2563EB]",
                )}
                aria-label="Refresh memories"
              >
                <RotateCw className={cn("size-4", isRefetching && "animate-spin")} />
              </button>
            </div>

            <div className="px-5 py-4 shrink-0">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Max Memories
                  </p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {state.max}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Current Used
                  </p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {state.count}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Usage
                  </p>
                  <p className={cn("mt-1 text-lg font-semibold", getPercentageColor(percentage))}>
                    {percentage}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <MemoryList
                memories={memories}
                isLoading={isLoading}
                onDelete={setDeleteTargetId}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this memory?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </>
  )
}
