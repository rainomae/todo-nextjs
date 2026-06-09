'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import FormField from '../../components/FormField'
import { parseError } from '../../utils/parseError'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof LoginForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<LoginForm> = {}
    if (!form.email.trim()) e.email = 'E-post on kohustuslik'
    if (!form.password) e.password = 'Parool on kohustuslik'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await login(form.email.trim(), form.password)
      router.replace('/dashboard')
    } catch (err) {
      setServerError(parseError(err, 'Sisselogimine ebaõnnestus'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Logi sisse</h1>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <FormField
            label="E-post"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            required
            placeholder="nimi@näide.ee"
          />
          <FormField
            label="Parool"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            required
          />
          {serverError && <p className="form-error-banner">{serverError}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sisenen...' : 'Logi sisse'}
          </button>
        </form>
        <p className="auth-footer">
          Pole kontot? <Link href="/register">Registreeru</Link>
        </p>
      </div>
    </div>
  )
}
