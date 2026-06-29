import { cn } from "@/lib/utils"

interface TableColumn<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
}

export function Table<T extends { [key: string]: unknown }>({
  columns,
  data,
  emptyMessage = "No usage data available yet",
  className,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6",
          className,
        )}
      >
        <p className="text-center text-sm text-[#64748b]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-[#e2e8f0] bg-[#f8fafc]",
        className,
      )}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e2e8f0]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#64748b]",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-gray-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-6 py-3 text-sm text-[#171717]",
                    col.className,
                  )}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
