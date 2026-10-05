import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "cn"

type StepsProps = {
  current: number
  direction?: "horizontal" | "vertical"
  items: { title: ReactNode }[]
  className?: string
}

function Steps({ current, direction = "horizontal", items, className }: StepsProps) {
  return (
    <ol data-slot="steps" className={cn("flex gap-4", direction === "vertical" ? "flex-col" : "flex-row flex-wrap items-start", className)}>
      {items.map((item, index) => {
        const state = index < current ? "finish" : index === current ? "process" : "wait"
        return (
          <li key={index} data-state={state} className={cn("flex min-w-0 flex-1 items-center gap-2", direction === "vertical" && "flex-none")} aria-current={state === "process" ? "step" : undefined}>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                state === "process" && "border-primary bg-primary text-primary-foreground",
                state === "finish" && "border-primary text-primary",
                state === "wait" && "border-border text-muted-foreground"
              )}
            >
              {state === "finish" ? <Check className="size-4" /> : index + 1}
            </span>
            <span className={cn("min-w-0 truncate text-sm", state === "wait" ? "text-muted-foreground" : "text-foreground")}>{item.title}</span>
            {direction === "horizontal" && index < items.length - 1 ? <span className="ml-2 hidden h-px flex-1 bg-border sm:block" aria-hidden="true" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

export { Steps }
