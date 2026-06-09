'use client'

import { useEffect, useState, useReducer } from 'react'
import { useTodos } from '../../../context/TodoContext'
import Modal from '../../../components/Modal'
import FormField from '../../../components/FormField'
import { parseError } from '../../../utils/parseError'
import type { TodoCategory } from '../../../types'

type CategoryForm = Omit<TodoCategory, 'id'>
type FormAction =
  | { type: 'SET'; field: keyof CategoryForm; value: string | number }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: CategoryForm }

const emptyForm = (): CategoryForm => ({ categoryName: '', categorySort: 0, tag: '' })

function formReducer(state: CategoryForm, action: FormAction): CategoryForm {
  switch (action.type) {
    case 'SET': return { ...state, [action.field]: action.value }
    case 'RESET': return emptyForm()
    case 'LOAD': return { ...action.payload }
  }
}

export default function CategoriesPage() {
  const { categories, loading, fetchCategories, addCategory, editCategory, removeCategory } = useTodos()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, dispatchForm] = useReducer(formReducer, emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryForm, string>>>({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        (c.tag ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : categories

  function openCreate() {
    dispatchForm({ type: 'RESET' })
    setEditingId(null); setErrors({}); setServerError(''); setShowModal(true)
  }

  function openEdit(cat: TodoCategory) {
    dispatchForm({ type: 'LOAD', payload: { categoryName: cat.categoryName, categorySort: cat.categorySort, tag: cat.tag ?? '' } })
    setEditingId(cat.id); setErrors({}); setServerError(''); setShowModal(true)
  }

  function close() { setShowModal(false) }

  function validate(): boolean {
    const e: Partial<Record<keyof CategoryForm, string>> = {}
    const name = form.categoryName.trim()
    if (!name) e.categoryName = 'Nimi on kohustuslik'
    else if (name.length < 2) e.categoryName = 'Vähemalt 2 tähemärki'
    else if (categories.some((c) => c.categoryName.toLowerCase() === name.toLowerCase() && c.id !== editingId))
      e.categoryName = 'Sellise nimega kategooria on juba olemas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true); setServerError('')
    try {
      const payload: CategoryForm = { categoryName: form.categoryName.trim(), categorySort: Number(form.categorySort) || 0, tag: form.tag }
      if (editingId) {
        await editCategory(editingId, { id: editingId, ...payload })
      } else {
        await addCategory(payload)
      }
      close()
    } catch (err) {
      setServerError(parseError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Kustuta kategooria?')) return
    try { await removeCategory(id) } catch (err) { alert(parseError(err, 'Kustutamine ebaõnnestus')) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Kategooriad</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>+ Lisa kategooria</button>
      </div>
      <div className="filter-bar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Otsi kategooriaid..." className="search-input" />
      </div>
      {loading && <div className="status-block">Laadin...</div>}
      {!loading && (
        <ul className="card-list">
          {filtered.map((cat) => (
            <li key={cat.id} className="item-card">
              <div className="card-row">
                <div className="card-main">
                  <p className="card-name">{cat.categoryName}</p>
                  <div className="card-meta">
                    {cat.tag && <span className="badge badge-subtle">{cat.tag}</span>}
                    <span className="card-meta-text">Järjestus: {cat.categorySort}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button type="button" className="btn-sm-edit" onClick={() => openEdit(cat)}>Muuda</button>
                  <button type="button" className="btn-sm-delete" onClick={() => handleDelete(cat.id)}>Kustuta</button>
                </div>
              </div>
            </li>
          ))}
          {!filtered.length && (
            <li className="status-block muted">
              {categories.length ? 'Otsingule vastavaid kategooriaid pole.' : 'Kategooriaid pole.'}
            </li>
          )}
        </ul>
      )}
      {showModal && (
        <Modal title={editingId ? 'Muuda kategooriat' : 'Lisa kategooria'} onClose={close}>
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            <FormField label="Nimi" value={form.categoryName} onChange={(e) => dispatchForm({ type: 'SET', field: 'categoryName', value: e.target.value })} error={errors.categoryName} required maxLength={128} />
            <FormField label="Järjestus">
              <input type="number" value={form.categorySort} onChange={(e) => dispatchForm({ type: 'SET', field: 'categorySort', value: e.target.value })} className="form-input" />
            </FormField>
            <FormField label="Tag" value={form.tag} onChange={(e) => dispatchForm({ type: 'SET', field: 'tag', value: e.target.value })} maxLength={50} />
            {serverError && <p className="form-error-banner">{serverError}</p>}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={close}>Tühista</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvestan...' : (editingId ? 'Salvesta' : 'Lisa')}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
