import * as React from "react"
import moment, { type Moment } from "moment"
import { CalendarIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "components/ui/button"
import { Calendar } from "components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover"

type DateTimePickerProps = {
  value?: Moment | null
  onChange?: (value: Moment) => void
  min?: Moment
  max?: Moment
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

const DISPLAY_FORMAT = "YYYY-MM-DD HH:mm"
const TIME_FORMAT = "HH:mm"

const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(function DateTimePicker(
  { value, onChange, min, max, placeholder, disabled, className, ...props },
  ref
) {
  const [open, setOpen] = React.useState(false)
  const current = value && value.isValid() ? value : null

  const emit = (next: Moment) => onChange?.(next.clone().seconds(0).milliseconds(0))

  const handleSelectDay = (day: Date | undefined) => {
    if (!day) return
    const base = current ?? moment().hours(12).minutes(0)
    emit(moment(day).hours(base.hours()).minutes(base.minutes()))
  }

  const handleChangeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const time = moment(e.target.value, TIME_FORMAT, true)
    if (!time.isValid()) return
    const base = current ?? moment()
    emit(base.clone().hours(time.hours()).minutes(time.minutes()))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          data-slot="input"
          data-placeholder={current ? undefined : ""}
          className={cn(
            "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-lg whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50",
            className
          )}
          {...props}
        >
          <span className="truncate">{current ? current.format(DISPLAY_FORMAT) : placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={current ? current.toDate() : undefined}
          defaultMonth={current ? current.toDate() : undefined}
          onSelect={handleSelectDay}
          disabled={[...(min ? [{ before: min.clone().startOf("day").toDate() }] : []), ...(max ? [{ after: max.clone().endOf("day").toDate() }] : [])]}
          weekStartsOn={1}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border p-2">
          <input
            type="time"
            step={60}
            aria-label="Time"
            value={current ? current.format(TIME_FORMAT) : ""}
            onChange={handleChangeTime}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!current}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})

export { DateTimePicker }
