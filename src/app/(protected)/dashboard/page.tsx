'use client'

import { useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTodos } from '../../../context/TodoContext'
import { isPast } from '../../../utils/date'

export default function DashboardPage() {
  const { fullName } = useAuth()
  const { tasks, categories, priorities, loading, fetchAll } = useTodos()

  useEffect(() => { fetchAll() }, [fetchAll])

  const total = tasks.length
  const completed = tasks.filter((t) => t.isCompleted).length
  const pending = tasks.filter((t) => !t.isCompleted && !t.isArchived).length
  const overdue = tasks.filter((t) => !t.isCompleted && isPast(t.dueDt)).length
  const archived = tasks.filter((t) => t.isArchived).length

  const recentTasks = [...tasks]
    .filter((t) => !t.isCompleted && !t.isArchived)
    .sort((a, b) => (a.taskSort ?? 0) - (b.taskSort ?? 0))
    .slice(0, 5)

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.categoryName]))
  const priorityMap = Object.fromEntries(priorities.map((p) => [p.id, p.priorityName]))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tere, {fullName || 'kasutaja'}!</h1>
      </div>

      {loading && <div className="status-block">Laadin...</div>}

      {!loading && (
        <>
          <div className="stats-grid">
            <div className="stat-card accent"><div className="stat-value">{total}</div><div className="stat-label">Ülesandeid kokku</div></div>
            <div className="stat-card done"><div className="stat-value">{completed}</div><div className="stat-label">Lõpetatud</div></div>
            <div className="stat-card"><div className="stat-value">{pending}</div><div className="stat-label">Pooleli</div></div>
            <div className="stat-card overdue"><div className="stat-value">{overdue}</div><div className="stat-label">Tähtaeg möödas</div></div>
            <div className="stat-card"><div className="stat-value">{archived}</div><div className="stat-label">Arhiveeritud</div></div>
            <div className="stat-card"><div className="stat-value">{categories.length}</div><div className="stat-label">Kategooriaid</div></div>
            <div className="stat-card"><div className="stat-value">{priorities.length}</div><div className="stat-label">Prioriteete</div></div>
          </div>

          {recentTasks.length > 0 && (
            <>
              <h2 className="section-title">Järgmised ülesanded</h2>
              <ul className="task-list">
                {recentTasks.map((t) => (
                  <li key={t.id} className="task-card">
                    <div className="task-row">
                      <div className="task-body">
                        <div className="task-title-row">
                          <p className="task-name">{t.taskName}</p>
                        </div>
                        <div className="task-meta">
                          {categoryMap[t.todoCategoryId ?? ''] && (
                            <span className="badge badge-subtle">{categoryMap[t.todoCategoryId!]}</span>
                          )}
                          {priorityMap[t.todoPriorityId ?? ''] && (
                            <span className="badge badge-muted">{priorityMap[t.todoPriorityId!]}</span>
                          )}
                          {t.dueDt && (
                            <span className={`task-due${isPast(t.dueDt) ? ' overdue' : ''}`}>
                              {isPast(t.dueDt) ? '⚠ ' : ''}{new Date(t.dueDt).toLocaleDateString('et-EE')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {total === 0 && (
            <div className="status-block muted">
              Ülesandeid pole. Mine ülesannete lehele ja lisa esimene!
            </div>
          )}
        </>
      )}
    </div>
  )
}
