"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-lg font-semibold text-neutral-900">
        Something went wrong
      </h2>
      <p className="text-sm text-neutral-500 max-w-sm text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button variant="outline" onClick={reset}>
        Try Again
      </Button>
    </div>
  )
}
