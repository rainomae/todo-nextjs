'use client'

import { useEffect, useState, useReducer } from 'react'
import { useTodos } from '../../../context/TodoContext'
import Modal from '../../../components/Modal'
import FormField from '../../../components/FormField'
import { parseError } from '../../../utils/parseError'
import type { TodoPriority } from '../../../types'

type PriorityForm = Omit<TodoPriority, 'id'>
type FormAction =
  | { type: 'SET'; field: keyof PriorityForm; value: string | number }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: PriorityForm }

const emptyForm = (): PriorityForm => ({ priorityName: '', prioritySort: 0 })

function formReducer(state: PriorityForm, action: FormAction): PriorityForm {
  switch (action.type) {
    case 'SET': return { ...state, [action.field]: action.value }
    case 'RESET': return emptyForm()
    case 'LOAD': return { ...action.payload }
  }
}

export default function PrioritiesPage() {
  const { priorities, loading, fetchPriorities, addPriority, editPriority, removePriority } = useTodos()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, dispatchForm] = useReducer(formReducer, emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof PriorityForm, string>>>({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPriorities() }, [fetchPriorities])

  const filtered = search.trim()
    ? priorities.filter((p) => p.priorityName.toLowerCase().includes(search.toLowerCase()))
    : priorities

  function openCreate() {
    dispatchForm({ type: 'RESET' })
    setEditingId(null); setErrors({}); setServerError(''); setShowModal(true)
  }

  function openEdit(p: TodoPriority) {
    dispatchForm({ type: 'LOAD', payload: { priorityName: p.priorityName, prioritySort: p.prioritySort } })
    setEditingId(p.id); setErrors({}); setServerError(''); setShowModal(true)
  }

  function close() { setShowModal(false) }

  function validate(): boolean {
    const e: Partial<Record<keyof PriorityForm, string>> = {}
    const name = form.priorityName.trim()
    if (!name) e.priorityName = 'Nimi on kohustuslik'
    else if (name.length < 2) e.priorityName = 'Vähemalt 2 tähemärki'
    else if (priorities.some((p) => p.priorityName.toLowerCase() === name.toLowerCase() && p.id !== editingId))
      e.priorityName = 'Sellise nimega prioriteet on juba olemas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true); setServerError('')
    try {
      const payload: PriorityForm = { priorityName: form.priorityName.trim(), prioritySort: Number(form.prioritySort) || 0 }
      if (editingId) {
        await editPriority(editingId, { id: editingId, ...payload })
      } else {
        await addPriority(payload)
      }
      close()
    } catch (err) {
      setServerError(parseError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Kustuta prioriteet?')) return
    try { await removePriority(id) } catch (err) { alert(parseError(err, 'Kustutamine ebaõnnestus')) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Prioriteedid</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>+ Lisa prioriteet</button>
      </div>
      <div className="filter-bar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Otsi prioriteete..." className="search-input" />
      </div>
      {loading && <div className="status-block">Laadin...</div>}
      {!loading && (
        <ul className="card-list">
          {filtered.map((p) => (
            <li key={p.id} className="item-card">
              <div className="card-row">
                <div className="card-main">
                  <p className="card-name">{p.priorityName}</p>
                  <div className="card-meta"><span className="card-meta-text">Järjestus: {p.prioritySort}</span></div>
                </div>
                <div className="card-actions">
                  <button type="button" className="btn-sm-edit" onClick={() => openEdit(p)}>Muuda</button>
                  <button type="button" className="btn-sm-delete" onClick={() => handleDelete(p.id)}>Kustuta</button>
                </div>
              </div>
            </li>
          ))}
          {!filtered.length && (
            <li className="status-block muted">
              {priorities.length ? 'Otsingule vastavaid prioriteete pole.' : 'Prioriteete pole.'}
            </li>
          )}
        </ul>
      )}
      {showModal && (
        <Modal title={editingId ? 'Muuda prioriteeti' : 'Lisa prioriteet'} onClose={close}>
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            <FormField label="Nimi" value={form.priorityName} onChange={(e) => dispatchForm({ type: 'SET', field: 'priorityName', value: e.target.value })} error={errors.priorityName} required maxLength={64} />
            <FormField label="Järjestus">
              <input type="number" value={form.prioritySort} onChange={(e) => dispatchForm({ type: 'SET', field: 'prioritySort', value: e.target.value })} className="form-input" />
            </FormField>
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
