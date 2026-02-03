const DAY_MS = 1000 * 60 * 60 * 24

export const getNextWaterDate = (lastWateredAt?: string, cadenceDays: number = 7): Date | null => {
  if (!lastWateredAt) return null
  const lastDate = new Date(lastWateredAt)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + cadenceDays)
  return nextDate
}

const normalizeToMidnight = (date: Date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export const getDaysDiffFromToday = (targetDate: Date): number => {
  const next = normalizeToMidnight(targetDate)
  const now = normalizeToMidnight(new Date())
  const diff = next.getTime() - now.getTime()
  return Math.ceil(diff / DAY_MS)
}

export const getWateringDaysDiff = (lastWateredAt?: string, cadenceDays: number = 7): number | null => {
  const next = getNextWaterDate(lastWateredAt, cadenceDays)
  if (!next) return null
  return getDaysDiffFromToday(next)
}

export const toDateInputValue = (isoString?: string): string => {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

export const toIsoFromDateInput = (value: string): string | null => {
  if (!value) return null
  const date = new Date(value)
  // Use midday to avoid timezone shifts when serializing.
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}
