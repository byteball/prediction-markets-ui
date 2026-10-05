import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: React.ReactNode
  text?: string
  group?: string
}

type ComboboxProps = {
  value?: string | null
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: React.ReactNode
  searchPlaceholder?: string
  emptyText?: React.ReactNode
  allowCustomValue?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  optionClassName?: string
}

const normalize = (s: string) => s.toLowerCase()

function Combobox({ value, onValueChange, options, placeholder, searchPlaceholder, emptyText = "No data", allowCustomValue = false, disabled, id, className, optionClassName, ...aria }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const listId = React.useId()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLElement>(null)
  const [container, setContainer] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    setContainer(triggerRef.current?.closest<HTMLElement>("[data-slot=sheet-content], [data-slot=dialog-content]") ?? null)
  }, [])

  const selected = options.find((o) => o.value === value)
  const filtered = React.useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return options
    return options.filter((o) => normalize(o.text ?? o.value).includes(q))
  }, [options, query])

  const groups = React.useMemo(() => {
    const map = new Map<string | undefined, ComboboxOption[]>()
    for (const o of filtered) {
      const list = map.get(o.group) ?? []
      list.push(o)
      map.set(o.group, list)
    }
    return [...map.entries()]
  }, [filtered])

  const commit = (next: string) => {
    onValueChange(next)
    setOpen(false)
    setQuery("")
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      if (open && filtered[activeIndex]) {
        e.preventDefault()
        commit(filtered[activeIndex].value)
      } else if (allowCustomValue) {
        setOpen(false)
      }
    }
  }

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  const renderList = (
    <div role="listbox" id={listId} className="max-h-64 overflow-y-auto p-1">
      {filtered.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        groups.map(([group, items]) => (
          <div key={group ?? "__default"} role="group">
            {group ? <div className="px-2 py-1.5 text-xs text-muted-foreground">{group}</div> : null}
            {items.map((o) => {
              const index = filtered.indexOf(o)
              const isSelected = o.value === value
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  data-active={index === activeIndex || undefined}
                  className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-base outline-none data-active:bg-muted", isSelected && "font-medium", optionClassName)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(o.value)}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )

  if (allowCustomValue) {
    return (
      <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div ref={triggerRef as React.RefObject<HTMLDivElement>} className={cn("relative", className)}>
            <input
              ref={inputRef}
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              {...aria}
              data-slot="input"
              disabled={disabled}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-lg outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30"
              placeholder={typeof placeholder === "string" ? placeholder : undefined}
              value={value ?? ""}
              onChange={(e) => {
                onValueChange(e.target.value)
                setQuery(e.target.value)
                setOpen(true)
              }}
              onClick={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent container={container} align="start" className="w-(--radix-popover-trigger-width) p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          {renderList}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          {...aria}
          data-slot="select-trigger"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
            className
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground", optionClassName)}>{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent container={container} align="start" className="w-(--radix-popover-trigger-width) p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b border-border p-1">
          <input
            ref={inputRef}
            autoFocus
            data-slot="input"
            className="h-8 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={searchPlaceholder ?? "Search"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        {renderList}
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
