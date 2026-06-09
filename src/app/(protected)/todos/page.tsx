'use client'

import { useEffect, useState, useReducer, useRef } from 'react'
import { useTodos } from '../../../context/TodoContext'
import Modal from '../../../components/Modal'
import FormField from '../../../components/FormField'
import { parseError } from '../../../utils/parseError'
import { formatDate, toLocalInputValue, fromLocalInputValue } from '../../../utils/date'
import type { TodoTask } from '../../../types'

interface TaskForm {
  taskName: string
  todoCategoryId: string | null
  todoPriorityId: string | null
  dueDt: string
  isCompleted: boolean
  isArchived: boolean
  taskSort: number
}

type FormAction =
  | { type: 'SET'; field: keyof TaskForm; value: TaskForm[keyof TaskForm] }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: TaskForm }

const emptyForm = (): TaskForm => ({
  taskName: '',
  todoCategoryId: null,
  todoPriorityId: null,
  dueDt: '',
  isCompleted: false,
  isArchived: false,
  taskSort: 0,
})

function formReducer(state: TaskForm, action: FormAction): TaskForm {
  switch (action.type) {
    case 'SET': return { ...state, [action.field]: action.value }
    case 'RESET': return emptyForm()
    case 'LOAD': return { ...action.payload }
  }
}

export default function TodosPage() {
  const {
    tasks, categories, priorities, loading, error,
    fetchAll, addTask, editTask, removeTask, reorderTasks, priorityRankById,
  } = useTodos()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('order')
  const [showArchived, setShowArchived] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, dispatchForm] = useReducer(formReducer, emptyForm())
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TaskForm, string>>>({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  const originalDueDt = useRef<string>('')
  const draggedId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [fetchAll])

  const filteredTasks = (() => {
    let list = [...tasks]
    if (!showArchived) list = list.filter((t) => !t.isArchived)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.taskName.toLowerCase().includes(q))
    }
    if (filterCategory) list = list.filter((t) => t.todoCategoryId === filterCategory)
    if (filterPriority) list = list.filter((t) => t.todoPriorityId === filterPriority)
    if (filterStatus === 'pending') list = list.filter((t) => !t.isCompleted)
    else if (filterStatus === 'completed') list = list.filter((t) => t.isCompleted)

    if (sortBy === 'name') list.sort((a, b) => a.taskName.localeCompare(b.taskName))
    else if (sortBy === 'due') list.sort((a, b) => {
      if (!a.dueDt) return 1
      if (!b.dueDt) return -1
      return new Date(a.dueDt).getTime() - new Date(b.dueDt).getTime()
    })
    else if (sortBy === 'created') list.sort((a, b) => new Date(a.createdDt ?? 0).getTime() - new Date(b.createdDt ?? 0).getTime())
    else list.sort((a, b) => (a.taskSort ?? 0) - (b.taskSort ?? 0))
    return list
  })()

  function onDragStart(e: React.DragEvent, task: TodoTask) { draggedId.current = task.id; e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e: React.DragEvent, task: TodoTask) { e.preventDefault(); setDragOverId(task.id) }
  function onDragEnd() { draggedId.current = null; setDragOverId(null) }

  async function onDrop(e: React.DragEvent, targetTask: TodoTask) {
    e.stopPropagation()
    if (!draggedId.current || draggedId.current === targetTask.id) { draggedId.current = null; setDragOverId(null); return }
    const ordered = [...tasks].sort((a, b) => (a.taskSort ?? 0) - (b.taskSort ?? 0))
    const fromIdx = ordered.findIndex((t) => t.id === draggedId.current)
    const toIdx = ordered.findIndex((t) => t.id === targetTask.id)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = ordered.splice(fromIdx, 1)
    ordered.splice(toIdx, 0, moved)
    const updated = ordered.map((t, i) => ({ ...t, taskSort: i }))
    const changed = updated.filter((t, i) => (tasks.find((x) => x.id === t.id)?.taskSort ?? 0) !== i)
    reorderTasks(updated)
    draggedId.current = null; setDragOverId(null)
    try {
      await Promise.all(changed.map((t) => editTask(t.id, {
        id: t.id, taskName: t.taskName, todoCategoryId: t.todoCategoryId,
        todoPriorityId: t.todoPriorityId, dueDt: t.dueDt,
        isCompleted: t.isCompleted, isArchived: t.isArchived, taskSort: t.taskSort,
      })))
    } catch (err) {
      alert(parseError(err, 'Järjestuse salvestamine ebaõnnestus'))
      await fetchAll()
    }
  }

  function openCreate() {
    dispatchForm({ type: 'RESET' })
    originalDueDt.current = ''
    setEditingId(null); setFormErrors({}); setServerError(''); setShowModal(true)
  }

  function openEdit(task: TodoTask) {
    const localDue = toLocalInputValue(task.dueDt)
    originalDueDt.current = localDue
    dispatchForm({
      type: 'LOAD',
      payload: {
        taskName: task.taskName,
        todoCategoryId: task.todoCategoryId,
        todoPriorityId: task.todoPriorityId,
        dueDt: localDue,
        isCompleted: task.isCompleted,
        isArchived: task.isArchived,
        taskSort: task.taskSort ?? 0,
      },
    })
    setEditingId(task.id); setFormErrors({}); setServerError(''); setShowModal(true)
  }

  function close() { setShowModal(false) }

  function validate(): boolean {
    const e: Partial<Record<keyof TaskForm, string>> = {}
    const name = form.taskName.trim()
    if (!name) e.taskName = 'Nimi on kohustuslik'
    else if (name.length < 2) e.taskName = 'Vähemalt 2 tähemärki'
    else if (name.length > 128) e.taskName = 'Max 128 tähemärki'
    if (!form.todoCategoryId) e.todoCategoryId = 'Kategooria on kohustuslik'
    if (!form.todoPriorityId) e.todoPriorityId = 'Prioriteet on kohustuslik'
    if (form.dueDt && form.dueDt !== originalDueDt.current && new Date(form.dueDt) < new Date())
      e.dueDt = 'Tähtaeg ei saa olla minevikus'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true); setServerError('')
    try {
      const payload = {
        taskName: form.taskName.trim(),
        todoCategoryId: form.todoCategoryId ?? undefined,
        todoPriorityId: form.todoPriorityId ?? undefined,
        dueDt: fromLocalInputValue(form.dueDt),
        isCompleted: form.isCompleted,
        isArchived: form.isArchived,
        taskSort: form.taskSort,
      }
      if (editingId) {
        await editTask(editingId, { id: editingId, ...payload })
      } else {
        await addTask({ ...payload, taskSort: tasks.length })
      }
      close()
    } catch (err) {
      setServerError(parseError(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggleComplete(task: TodoTask) {
    try {
      await editTask(task.id, {
        id: task.id, taskName: task.taskName,
        todoCategoryId: task.todoCategoryId, todoPriorityId: task.todoPriorityId,
        dueDt: task.dueDt, isCompleted: !task.isCompleted,
        isArchived: task.isArchived, taskSort: task.taskSort ?? 0,
      })
    } catch (err) {
      alert(parseError(err, 'Staatuse muutmine ebaõnnestus'))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Kustuta ülesanne?')) return
    try { await removeTask(id) } catch (err) { alert(parseError(err, 'Kustutamine ebaõnnestus')) }
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.categoryName ?? ''
  const priorityName = (id: string | null) => priorities.find((p) => p.id === id)?.priorityName ?? ''
  const isOverdue = (t: TodoTask) => !t.isCompleted && !!t.dueDt && new Date(t.dueDt) < new Date()

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Ülesanded</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>+ Lisa ülesanne</button>
      </div>
      <div className="filter-bar">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Otsi ülesandeid..." className="search-input" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="app-select">
          <option value="">Kõik kategooriad</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="app-select">
          <option value="">Kõik prioriteedid</option>
          {priorities.map((p) => <option key={p.id} value={p.id}>{p.priorityName}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="app-select">
          <option value="">Kõik staatused</option>
          <option value="pending">Pooleli</option>
          <option value="completed">Lõpetatud</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="app-select">
          <option value="order">Järjestus</option>
          <option value="name">Nimi</option>
          <option value="due">Tähtaeg</option>
          <option value="created">Loomise aeg</option>
        </select>
        <label className="filter-checkbox">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Arhiveeritud
        </label>
      </div>

      {loading && <div className="status-block">Laadin...</div>}
      {error && <div className="status-block error">{error}</div>}

      {!loading && (
        <ul className="task-list">
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              draggable={sortBy === 'order'}
              onDragStart={(e) => onDragStart(e, task)}
              onDragOver={(e) => onDragOver(e, task)}
              onDrop={(e) => onDrop(e, task)}
              onDragEnd={onDragEnd}
              className={[
                'task-card',
                `priority-${priorityRankById[task.todoPriorityId ?? ''] ?? 'medium'}`,
                task.isCompleted ? 'task-done' : '',
                task.isArchived ? 'task-archived' : '',
                draggedId.current === task.id ? 'dragging' : '',
                dragOverId === task.id && draggedId.current !== task.id ? 'drag-over' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="task-row">
                {sortBy === 'order' && (
                  <svg className="drag-handle" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <circle cx="7" cy="4" r="1.5"/><circle cx="13" cy="4" r="1.5"/>
                    <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
                    <circle cx="7" cy="16" r="1.5"/><circle cx="13" cy="16" r="1.5"/>
                  </svg>
                )}
                <input type="checkbox" checked={task.isCompleted} onChange={() => toggleComplete(task)} className="task-check" />
                <div className="task-body">
                  <div className="task-title-row">
                    <p className={`task-name${task.isCompleted ? ' done' : ''}`}>{task.taskName}</p>
                    {task.isCompleted && <span className="badge badge-success">Lõpetatud</span>}
                    {task.isArchived && <span className="badge badge-muted">Arhiveeritud</span>}
                  </div>
                  <div className="task-meta">
                    {categoryName(task.todoCategoryId) && <span className="badge badge-subtle">{categoryName(task.todoCategoryId)}</span>}
                    {priorityName(task.todoPriorityId) && (
                      <span className={`badge badge-${priorityRankById[task.todoPriorityId ?? ''] ?? 'medium'}`}>
                        {priorityName(task.todoPriorityId)}
                      </span>
                    )}
                    {task.dueDt && (
                      <span className={`task-due${isOverdue(task) ? ' overdue' : ''}`}>
                        {isOverdue(task) ? '⚠ ' : ''}{formatDate(task.dueDt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  <button type="button" className="btn-sm-edit" onClick={() => openEdit(task)}>Muuda</button>
                  <button type="button" className="btn-sm-delete" onClick={() => handleDelete(task.id)}>Kustuta</button>
                </div>
              </div>
            </li>
          ))}
          {!filteredTasks.length && (
            <li className="status-block muted">
              {tasks.length ? 'Filtrile vastavaid ülesandeid pole.' : 'Ülesandeid pole. Lisa esimene!'}
            </li>
          )}
        </ul>
      )}

      {showModal && (
        <Modal title={editingId ? 'Muuda ülesannet' : 'Lisa ülesanne'} onClose={close}>
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            <FormField label="Nimi" value={form.taskName} onChange={(e) => dispatchForm({ type: 'SET', field: 'taskName', value: e.target.value })} error={formErrors.taskName} required maxLength={128} />
            <div className="form-row-2">
              <FormField label="Kategooria *" error={formErrors.todoCategoryId}>
                <select value={form.todoCategoryId ?? ''} onChange={(e) => dispatchForm({ type: 'SET', field: 'todoCategoryId', value: e.target.value || null })} className={`form-input${formErrors.todoCategoryId ? ' input-error' : ''}`}>
                  <option value="">— vali —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                </select>
              </FormField>
              <FormField label="Prioriteet *" error={formErrors.todoPriorityId}>
                <select value={form.todoPriorityId ?? ''} onChange={(e) => dispatchForm({ type: 'SET', field: 'todoPriorityId', value: e.target.value || null })} className={`form-input${formErrors.todoPriorityId ? ' input-error' : ''}`}>
                  <option value="">— vali —</option>
                  {priorities.map((p) => <option key={p.id} value={p.id}>{p.priorityName}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Tähtaeg" error={formErrors.dueDt}>
              <input type="datetime-local" value={form.dueDt} onChange={(e) => dispatchForm({ type: 'SET', field: 'dueDt', value: e.target.value })} className={`form-input${formErrors.dueDt ? ' input-error' : ''}`} />
            </FormField>
            <div className="check-row">
              <label className="filter-checkbox">
                <input type="checkbox" checked={form.isCompleted} onChange={(e) => dispatchForm({ type: 'SET', field: 'isCompleted', value: e.target.checked })} />
                Lõpetatud
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" checked={form.isArchived} onChange={(e) => dispatchForm({ type: 'SET', field: 'isArchived', value: e.target.checked })} />
                Arhiveeritud
              </label>
            </div>
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
