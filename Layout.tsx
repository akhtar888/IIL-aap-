import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ThemeToggle from './ThemeToggle'

interface NavItem { to: string; label: string; icon?: string }

export default function Layout({ brand, links }: { brand: string; links: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10'
            }`}>
          {l.icon && <span>{l.icon}</span>}
          {l.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      <aside className="glass sticky top-0 hidden h-screen w-60 flex-col gap-4 p-4 lg:flex">
        <h2 className="px-2 text-lg font-bold">{brand}</h2>
        {nav}
        <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
          <ThemeToggle />
          <button onClick={logout} className="text-sm text-slate-400 transition hover:text-red-500">Logout</button>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 lg:hidden">
        <div className="glass flex items-center justify-between px-4 py-3">
          <button onClick={() => setOpen(!open)} className="text-xl" aria-label="Menu">☰</button>
          <h2 className="font-bold">{brand}</h2>
          <ThemeToggle />
        </div>
        {open && (
          <div className="glass mx-3 mt-2 flex flex-col gap-1 p-3">
            {nav}
            <button onClick={logout} className="mt-2 text-left text-sm text-slate-400 hover:text-red-500">Logout</button>
          </div>
        )}
      </div>

      <main className="flex-1 px-4 pb-10 pt-20 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
