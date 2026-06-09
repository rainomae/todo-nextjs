'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useTodos } from '../context/TodoContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/todos', label: 'Ülesanded' },
  { to: '/categories', label: 'Kategooriad' },
  { to: '/priorities', label: 'Prioriteedid' },
] as const

export default function NavBar() {
  const { fullName, logout } = useAuth()
  const { reset } = useTodos()
  const router = useRouter()
  const pathname = usePathname()

  function handleLogout() {
    reset()
    logout()
    router.replace('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link href="/dashboard" className="brand-link">ToDo App</Link>
      </div>
      <ul className="nav-links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              href={to}
              className={`nav-link${pathname === to ? ' active' : ''}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="nav-user">
        <span className="user-name">{fullName}</span>
        <button type="button" className="btn-logout" onClick={handleLogout}>Logi välja</button>
      </div>
    </nav>
  )
}
