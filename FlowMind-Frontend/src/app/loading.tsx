import { Spinner } from "@/components/shared/Spinner"

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8" />
      <span className="ml-3 text-sm text-neutral-500">Loading...</span>
    </div>
  )
}
