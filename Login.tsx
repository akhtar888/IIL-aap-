import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const HOME: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) navigate(HOME[profile.role] ?? '/', { replace: true })
  }, [profile, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight">IIL English Speaking Institute</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Login karo — apna dashboard khul jayega</p>
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70"
          placeholder="student@iil.com" />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70"
          placeholder="••••••••" />
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
        )}
        <button type="submit" disabled={busy}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50">
          {busy ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  )
}
