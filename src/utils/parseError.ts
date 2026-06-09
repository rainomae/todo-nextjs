interface ApiError {
  response?: {
    data?: unknown
    status?: number
  }
  message?: string
}

export function parseError(e: unknown, fallback = 'Salvestamine ebaõnnestus'): string {
  const err = e as ApiError
  const data = err?.response?.data
  const status = err?.response?.status

  if (!data) {
    if (err?.message) return `Võrgu viga: ${err.message}`
    return fallback
  }

  const obj = data as Record<string, unknown>

  if (Array.isArray(obj.errors) && obj.errors.length) {
    return (obj.errors as unknown[]).map(extractMessage).map(cleanDotnetMessage).join(' ')
  }
  if (Array.isArray(obj.messages) && obj.messages.length) {
    return (obj.messages as unknown[]).map(extractMessage).map(cleanDotnetMessage).join(' ')
  }
  if (obj.errors && typeof obj.errors === 'object' && !Array.isArray(obj.errors)) {
    const messages = Object.entries(obj.errors as Record<string, unknown>).map(([field, msgs]) => {
      const label = fieldLabel(field)
      const raw = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
      const msg = cleanDotnetMessage(raw)
      return label ? `${label}: ${msg}` : msg
    })
    if (messages.length) return messages.join(' | ')
  }
  if (typeof obj.title === 'string') {
    const detail = typeof obj.detail === 'string' ? cleanDotnetMessage(obj.detail) : null
    return detail ? `${obj.title}: ${detail}` : obj.title
  }
  if (typeof obj.message === 'string') return cleanDotnetMessage(obj.message)
  if (typeof obj.error === 'string') return cleanDotnetMessage(obj.error)
  if (typeof data === 'string' && data.trim()) return cleanDotnetMessage(data)

  if (status === 400) return 'Vigased andmed — kontrolli välju'
  if (status === 401) return 'Seanss aegus — logi uuesti sisse'
  if (status === 403) return 'Puudub õigus seda toimingut teha'
  if (status === 404) return 'Kirjet ei leitud'
  if (status === 409) return 'Konflikt — selline kirje on juba olemas'
  if (status !== undefined && status >= 500) return 'Serveri viga — proovi hiljem uuesti'

  return fallback
}

function extractMessage(item: unknown): string {
  if (item == null) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>
    const val = o.description ?? o.Description ?? o.message ?? o.Message
      ?? o.error ?? o.title ?? o.code ?? o.Code
    return val != null ? String(val) : JSON.stringify(item)
  }
  return String(item)
}

function cleanDotnetMessage(msg: string): string {
  if (!msg) return msg
  if (/could not be converted to System\.Guid/i.test(msg)) return 'Vigane ID väärtus'
  if (/field is required/i.test(msg)) {
    const field = msg.match(/The (\w+) field/)?.[1]
    const label = field ? fieldLabel(field) : null
    return label ? `${label} on kohustuslik` : 'Kohustuslik väli puudub'
  }
  if (/Passwords must be at least (\d+)/i.test(msg)) {
    const n = msg.match(/at least (\d+)/i)?.[1]
    return `Parool peab olema vähemalt ${n} märki pikk`
  }
  if (/Passwords must have at least one non alphanumeric/i.test(msg)) return 'Parool peab sisaldama vähemalt ühte erimärki'
  if (/Passwords must have at least one digit/i.test(msg)) return 'Parool peab sisaldama vähemalt ühte numbrit'
  if (/Passwords must have at least one lowercase/i.test(msg)) return 'Parool peab sisaldama vähemalt ühte väiketähte'
  if (/Passwords must have at least one uppercase/i.test(msg)) return 'Parool peab sisaldama vähemalt ühte suurtähte'
  if (/is already taken/i.test(msg) || /DuplicateUserName/i.test(msg) || /DuplicateEmail/i.test(msg) || /User already registered/i.test(msg)) return 'Selle e-postiga kasutaja on juba olemas'
  if (/User not found/i.test(msg)) return 'Kasutajat ei leitud'
  if (/Wrong password/i.test(msg)) return 'Vale parool'
  if (/Bad user\/password|Invalid login|incorrect password/i.test(msg)) return 'Vale e-post või parool'
  if (/Invalid email|Email.*invalid/i.test(msg)) return 'Vigane e-posti aadress'
  if (/User registration failed/i.test(msg)) return 'Registreerimine ebaõnnestus'
  return msg.replace(/\s*Path:[^|]+(\|[^|]+)*/g, '').replace(/\.$/, '').trim()
}

function fieldLabel(field: string): string {
  const map: Record<string, string> = {
    TaskName: 'Nimi', CategoryName: 'Nimi', PriorityName: 'Nimi',
    DueDt: 'Tähtaeg', TaskSort: 'Järjestus',
    TodoCategoryId: 'Kategooria', TodoPriorityId: 'Prioriteet',
    Email: 'E-post', Password: 'Parool',
    FirstName: 'Eesnimi', LastName: 'Perekonnanimi',
  }
  return map[field] ?? ''
}
