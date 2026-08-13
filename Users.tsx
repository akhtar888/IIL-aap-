import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Role = 'student' | 'teacher' | 'admin'
interface UserRow { id: string; name: string; email: string; role: Role; streak_count: number; created_at: string }

const ROLES: Role[] = ['student', 'teacher', 'admin']

export default function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const { data } = await supabase.from('profiles').select('id, name, email, role, streak_count, created_at').order('created_at')
    setUsers(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { error } = await supabase.rpc('admin_create_user', { p_name: name, p_email: email, p_password: password, p_role: role })
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: `User "${name}" ban gaya ✅` }); setName(''); setEmail(''); setPassword(''); setRole('student'); load() }
    setBusy(false)
  }

  async function handleRole(userId: string, newRole: Role) {
    const { error } = await supabase.rpc('set_user_role', { target_user_id: userId, new_role: newRole })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Role updated ✅' })
    load()
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Delete ${u.name}? Ye action undo nahi ho sakta.`)) return
    const { error } = await supabase.rpc('admin_delete_user', { p_id: u.id })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `${u.name} deleted 🗑️` })
    load()
  }

  const badge: Record<Role, string> = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    teacher: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Students, teachers aur admins — create, role assign, delete. Sirf aap.</p>
      </header>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>{msg.text}</div>}

      <form onSubmit={handleCreate} className="glass grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" disabled={busy}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50">
          {busy ? 'Creating…' : '+ Create user'}
        </button>
      </form>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/40 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Streak</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => {
              const isSelf = u.id === user?.id
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.name}{isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} disabled={isSelf} onChange={(e) => handleRole(u.id, e.target.value as Role)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none disabled:opacity-60 ${badge[u.role]}`}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">🔥 {u.streak_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u)} disabled={isSelf}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/40">Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-8 text-center text-slate-500 dark:text-slate-400">Koi user nahi mila.</p>}
      </div>
    </div>
  )
}
