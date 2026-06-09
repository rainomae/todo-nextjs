export function decodeJwtExp(token: string): number {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json) as { exp?: number }
    return typeof exp === 'number' ? exp * 1000 : 0
  } catch {
    return 0
  }
}

export function isExpiringSoon(token: string, thresholdMs = 30_000): boolean {
  const expMs = decodeJwtExp(token)
  if (!expMs) return false
  return Date.now() >= expMs - thresholdMs
}
