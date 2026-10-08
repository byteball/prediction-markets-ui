import { useId, type ReactNode } from "react"
import { cn } from "cn"

export type FormItemStatus = "success" | "warning" | "error" | "validating" | "" | undefined

type ControlProps = {
  id: string
  "aria-invalid": boolean | undefined
  "aria-describedby": string | undefined
}

type FormItemProps = {
  label?: ReactNode
  help?: ReactNode
  extra?: ReactNode
  status?: FormItemStatus
  className?: string
  id?: string
  htmlFor?: string
  children: ReactNode | ((control: ControlProps) => ReactNode)
}

function FormItem({ label, help, extra, status, className, id: idProp, htmlFor, children }: FormItemProps) {
  const generatedId = useId()
  const id = idProp ?? `field-${generatedId}`
  const helpId = `${id}-help`
  const extraId = `${id}-extra`
  const isError = status === "error"
  const describedBy = [help ? helpId : null, extra ? extraId : null].filter(Boolean).join(" ") || undefined

  const control: ControlProps = { id, "aria-invalid": isError || undefined, "aria-describedby": describedBy }
  const labelFor = htmlFor ?? (typeof children === "function" ? id : undefined)

  return (
    <div role="group" data-slot="form-item" data-status={status || undefined} className={cn("mb-6 flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={labelFor} className="flex w-fit items-center gap-2 text-base leading-snug font-normal text-white/45 select-none">
          {label}
        </label>
      ) : null}
      {typeof children === "function" ? children(control) : children}
      {help ? (
        isError ? (
          <div id={helpId} role="alert" className="text-xs text-destructive">
            {help}
          </div>
        ) : (
          <p id={helpId} className={cn("text-xs leading-normal text-muted-foreground [&>a]:underline [&>a]:underline-offset-4", status === "warning" && "text-draw")}>
            {help}
          </p>
        )
      ) : null}
      {extra ? (
        <p id={extraId} className="text-xs leading-normal text-muted-foreground [&>a]:underline [&>a]:underline-offset-4">
          {extra}
        </p>
      ) : null}
    </div>
  )
}

export { FormItem }
