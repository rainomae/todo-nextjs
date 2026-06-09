'use client'

import type { ReactNode, InputHTMLAttributes } from 'react'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label?: string
  error?: string | null
  children?: ReactNode
}

export default function FormField({ label, error, required, children, ...inputProps }: FormFieldProps) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}{required && ' *'}
        </label>
      )}
      {children ?? (
        <input
          className={`form-input${error ? ' input-error' : ''}`}
          required={required}
          {...inputProps}
        />
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
