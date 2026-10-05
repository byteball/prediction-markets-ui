import * as React from "react"
import { cn } from "cn"

type InputGroupProps = React.ComponentProps<"input"> & {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
  fieldClassName?: string
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
  { prefix, suffix, addonBefore, addonAfter, className, fieldClassName, ...props },
  ref
) {
  const hasAddon = !!(addonBefore || addonAfter)

  const field = (
    <div
      data-slot="input-group-field"
      className={cn(
        "flex h-10 min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors dark:bg-input/30",
        hasAddon ? "flex-1" : "w-full",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 has-[input:disabled]:opacity-50",
        hasAddon && "rounded-none",
        addonBefore && !addonAfter && "rounded-r-lg",
        addonAfter && !addonBefore && "rounded-l-lg",
        fieldClassName
      )}
    >
      {prefix ? (
        <span data-slot="input-prefix" className="flex shrink-0 items-center text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <input
        ref={ref}
        data-slot="input"
        className={cn("h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed", className)}
        {...props}
      />
      {suffix ? (
        <span data-slot="input-suffix" className="flex max-w-[60%] shrink-0 items-center truncate text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  )

  if (!hasAddon) return field

  return (
    <div data-slot="input-group" className="flex w-full items-stretch">
      {addonBefore ? <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">{addonBefore}</span> : null}
      {field}
      {addonAfter ? <span className="flex items-center rounded-r-lg border border-l-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">{addonAfter}</span> : null}
    </div>
  )
})

export { InputGroup }
