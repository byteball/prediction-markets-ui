import * as React from "react"
import moment, { type Moment } from "moment"
import { cn } from "cn"

// Replacement for antd `<DatePicker showTime format="YYYY-MM-DD HH:mm">` built on the native
// `datetime-local` input (supported by the whole browser floor of this project, see package.json
// browserslist). Values stay `moment` objects in local time, exactly what the forms expect:
// the forms turn them into unix seconds (`.unix()`) and format the payload in UTC themselves.
// Minute precision (`step=60`), seconds are always 0.
type DateTimePickerProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "min" | "max" | "type"> & {
  value?: Moment | null
  onChange?: (value: Moment) => void
  /** Earliest selectable moment (inclusive). Dates before it are rejected by the browser UI. */
  min?: Moment
  max?: Moment
}

const LOCAL_FORMAT = "YYYY-MM-DDTHH:mm"

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(function DateTimePicker(
  { value, onChange, min, max, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="datetime-local"
      step={60}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70",
        className
      )}
      value={value && value.isValid() ? value.format(LOCAL_FORMAT) : ""}
      min={min ? min.format(LOCAL_FORMAT) : undefined}
      max={max ? max.format(LOCAL_FORMAT) : undefined}
      onChange={(e) => {
        if (!e.target.value) return // the browser clears the field on an incomplete value; keep the last valid one
        const next = moment(e.target.value, LOCAL_FORMAT, true)
        if (next.isValid()) onChange?.(next.seconds(0).milliseconds(0))
      }}
      {...props}
    />
  )
})

export { DateTimePicker }
