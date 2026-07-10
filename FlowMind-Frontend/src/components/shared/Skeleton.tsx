import { cn } from "@/lib/utils"

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200",
        className,
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
      <SkeletonBox className="mb-3 h-4 w-24" />
      <SkeletonBox className="h-8 w-20" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
      <SkeletonBox className="mb-4 h-4 w-32" />
      <SkeletonBox className="h-64 w-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
      <SkeletonBox className="mb-4 h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className="mb-2 h-10 w-full" />
      ))}
    </div>
  )
}
