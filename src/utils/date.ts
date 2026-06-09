const pad = (n: number): string => String(n).padStart(2, '0')

export function formatDate(dt: string | null | undefined): string {
  if (!dt) return ''
  const d = new Date(dt)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function toLocalInputValue(dt: string | null | undefined): string {
  if (!dt) return ''
  const d = new Date(dt)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInputValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function isPast(dt: string | null | undefined): boolean {
  return !!dt && new Date(dt) < new Date()
}
