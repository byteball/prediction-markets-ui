import { useId, type ReactNode } from "react"
import { cn } from "cn"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

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
    <Field data-slot="form-item" data-status={status || undefined} className={cn("mb-6 gap-1.5", className)}>
      {label ? (
        <FieldLabel htmlFor={id} className="text-base font-normal text-white/45">
          {label}
        </FieldLabel>
      ) : null}
      {typeof children === "function" ? children(control) : children}
      {help ? (
        isError ? (
          <FieldError id={helpId} className="text-xs">
            {help}
          </FieldError>
        ) : (
          <FieldDescription id={helpId} className={cn("text-xs", status === "warning" && "text-draw")}>
            {help}
          </FieldDescription>
        )
      ) : null}
      {extra ? (
        <FieldDescription id={extraId} className="text-xs">
          {extra}
        </FieldDescription>
      ) : null}
    </Field>
  )
}

export { FormItem }
