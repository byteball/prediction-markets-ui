import { useId, type ReactNode } from "react"
import { cn } from "cn"

import { Label } from "@/components/ui/label"

// Replacement for antd `Form.Item` as the forms use it: a label, a control, a help/error line and an
// extra line, driven by the controlled `validateStatus` the forms already compute. It wires
// label ↔ control (`htmlFor`/`id`), `aria-invalid` and `aria-describedby` through a render prop.
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
  /** Control id; generated when omitted. */
  id?: string
  children: ReactNode | ((control: ControlProps) => ReactNode)
}

function FormItem({ label, help, extra, status, className, id: idProp, children }: FormItemProps) {
  const generatedId = useId()
  const id = idProp ?? `field-${generatedId}`
  const helpId = `${id}-help`
  const extraId = `${id}-extra`
  const isError = status === "error"
  const describedBy = [help ? helpId : null, extra ? extraId : null].filter(Boolean).join(" ") || undefined

  const control: ControlProps = { id, "aria-invalid": isError || undefined, "aria-describedby": describedBy }

  return (
    <div data-slot="form-item" data-status={status || undefined} className={cn("mb-4 flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={id} className="text-base text-muted-foreground">
          {label}
        </Label>
      ) : null}
      {typeof children === "function" ? children(control) : children}
      {help ? (
        <div id={helpId} className={cn("text-xs", isError ? "text-destructive" : status === "warning" ? "text-draw" : "text-muted-foreground")} role={isError ? "alert" : undefined}>
          {help}
        </div>
      ) : null}
      {extra ? (
        <div id={extraId} className="text-xs text-muted-foreground">
          {extra}
        </div>
      ) : null}
    </div>
  )
}

export { FormItem }
