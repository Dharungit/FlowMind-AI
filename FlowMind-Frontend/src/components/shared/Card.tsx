import { cn } from "@/lib/utils"

interface CardProps {
  title?: string
  className?: string
  children: React.ReactNode
}

export function Card({ title, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6",
        className,
      )}
    >
      {title && (
        <h3 className="mb-4 text-sm font-medium text-[#64748b]">{title}</h3>
      )}
      {children}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function SummaryCard({ label, value, className }: SummaryCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between", className)}>
      <span className="text-sm text-[#64748b]">{label}</span>
      <span className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#171717]">
        {value}
      </span>
    </Card>
  )
}
