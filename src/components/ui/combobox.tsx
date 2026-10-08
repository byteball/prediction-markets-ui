import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"

import i18n from "locale"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

function Combobox({ value, onValueChange, options, placeholder, searchPlaceholder, emptyText, allowCustomValue = false, disabled, id, className, optionClassName, ...aria }: ComboboxProps) {
  // In free-text mode nothing is highlighted until the user arrows onto an item, so Enter keeps the typed value.
  const initialIndex = allowCustomValue ? -1 : 0
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(initialIndex)
  const listId = React.useId()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)

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

  const setOpenState = (next: boolean) => {
    setOpen(next)
    setActiveIndex(initialIndex)
    if (!next && !allowCustomValue) setQuery("")
  }

  const commit = (next: string) => {
    onValueChange(next)
    setOpen(false)
    setQuery("")
    setActiveIndex(initialIndex)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) setOpenState(true)
      else setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, initialIndex))
    } else if (e.key === "Enter") {
      const active = open && activeIndex >= 0 ? filtered[activeIndex] : undefined
      if (active) {
        e.preventDefault()
        commit(active.value)
      } else if (allowCustomValue) {
        setOpenState(false)
      }
    }
  }

  const renderList = (
    <div role="listbox" id={listId} className="max-h-64 overflow-y-auto p-1">
      {filtered.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText ?? i18n.t("common.no_data", "No data")}</div>
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
      <Popover open={open && filtered.length > 0} onOpenChange={setOpenState}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className={cn("relative", className)}>
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
                setActiveIndex(initialIndex)
              }}
              onClick={() => setOpenState(true)}
              onKeyDown={onKeyDown}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
          }}
        >
          {renderList}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpenState}>
      <PopoverTrigger asChild>
        <button
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
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b border-border p-1">
          <input
            ref={inputRef}
            autoFocus
            data-slot="input"
            className="h-8 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={searchPlaceholder ?? i18n.t("common.search", "Search")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(initialIndex)
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        {renderList}
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
