'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import FormField from '../../components/FormField'
import { parseError } from '../../utils/parseError'

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirm: string
}

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState<RegisterForm>({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof RegisterForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<RegisterForm> = {}
    if (!form.firstName.trim()) e.firstName = 'Eesnimi on kohustuslik'
    if (!form.lastName.trim()) e.lastName = 'Perekonnanimi on kohustuslik'
    if (!form.email.trim()) e.email = 'E-post on kohustuslik'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Vigane e-posti aadress'
    if (!form.password) e.password = 'Parool on kohustuslik'
    else if (form.password.length < 6) e.password = 'Parool peab olema vähemalt 6 märki'
    if (form.password !== form.confirm) e.confirm = 'Paroolid ei ühti'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await register(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim())
      router.replace('/dashboard')
    } catch (err) {
      setServerError(parseError(err, 'Registreerimine ebaõnnestus'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Registreeru</h1>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row-2">
            <FormField label="Eesnimi" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} required maxLength={64} />
            <FormField label="Perekonnanimi" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} required maxLength={64} />
          </div>
          <FormField label="E-post" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} required placeholder="nimi@näide.ee" />
          <FormField label="Parool" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} required />
          <FormField label="Korda parooli" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} required />
          {serverError && <p className="form-error-banner">{serverError}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registreerin...' : 'Registreeru'}
          </button>
        </form>
        <p className="auth-footer">
          On juba konto? <Link href="/login">Logi sisse</Link>
        </p>
      </div>
    </div>
  )
}
