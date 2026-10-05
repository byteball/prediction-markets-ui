import { useEffect, useState } from "react"

type CountdownProps = {
  value: number
  daysLabel: string
  className?: string
}

const pad = (n: number) => String(n).padStart(2, "0")

export const formatCountdown = (secondsLeft: number, daysLabel: string) => {
  const total = Math.max(0, Math.floor(secondsLeft))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${pad(days)} ${daysLabel} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function Countdown({ value, daysLabel, className }: CountdownProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span data-slot="countdown" className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatCountdown(value - now, daysLabel)}
    </span>
  )
}

export { Countdown }
