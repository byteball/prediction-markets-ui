import type { ReactNode } from "react"
import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react"
import { cn } from "cn"

type ResultProps = {
  status?: "success" | "error" | "info" | "warning" | "loading"
  icon?: ReactNode
  title: ReactNode
  subTitle?: ReactNode
  extra?: ReactNode
  className?: string
}

const icons: Record<NonNullable<ResultProps["status"]>, ReactNode> = {
  success: <CircleCheck className="size-16 text-yes" />,
  error: <CircleX className="size-16 text-destructive" />,
  info: <Info className="size-16 text-primary" />,
  warning: <TriangleAlert className="size-16 text-draw" />,
  loading: <Loader2 className="size-16 animate-spin text-primary" />,
}

function Result({ status = "info", icon, title, subTitle, extra, className }: ResultProps) {
  return (
    <div data-slot="result" className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <div className="mb-2 flex items-center justify-center">{icon ?? icons[status]}</div>
      <div className="text-2xl font-medium text-foreground">{title}</div>
      {subTitle ? <div className="text-sm text-muted-foreground">{subTitle}</div> : null}
      {extra ? <div className="mt-4 flex flex-wrap justify-center gap-2">{extra}</div> : null}
    </div>
  )
}

export { Result }
