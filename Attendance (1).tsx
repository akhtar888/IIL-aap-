import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface AttendanceRow { date: string; status: string; in_time: string | null; out_time: string | null }

const badge: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  absent: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [month, setMonth] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('attendance').select('date, status, in_time, out_time')
        .eq('student_id', user.id).order('date', { ascending: false })
      setRows(data ?? []); setLoading(false)
    })()
  }, [user])

  const months = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) s.add(r.date.slice(0, 7))
    return [...s].sort().reverse()
  }, [rows])

  const filtered = month === 'all' ? rows : rows.filter((r) => r.date.startsWith(month))

  const stats = useMemo(() => {
    const present = filtered.filter((r) => r.status === 'present').length
    const absent = filtered.filter((r) => r.status === 'absent').length
    const late = filtered.filter((r) => r.status === 'late').length
    const total = filtered.length
    return { present, absent, late, total, pct: total ? Math.round((present / total) * 100) : 0 }
  }, [filtered])

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading attendance…</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Apni hazari — teacher mark karta hai, tum dekho.</p>
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All time</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass p-5 text-center"><p className="text-2xl font-bold text-emerald-500">{stats.present}</p><p className="text-xs text-slate-400">Present</p></div>
        <div className="glass p-5 text-center"><p className="text-2xl font-bold text-amber-500">{stats.late}</p><p className="text-xs text-slate-400">Late</p></div>
        <div className="glass p-5 text-center"><p className="text-2xl font-bold text-red-500">{stats.absent}</p><p className="text-xs text-slate-400">Absent</p></div>
        <div className="glass p-5 text-center"><p className="text-2xl font-bold text-indigo-500">{stats.pct}%</p><p className="text-xs text-slate-400">Attendance rate</p></div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📅</p><p className="mt-2 font-medium">Abhi koi attendance record nahi</p></div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/40 text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">In time</th><th className="px-4 py-3">Out time</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r, i) => {
                const d = new Date(r.date + 'T00:00:00')
                return (
                  <tr key={i}>
                    <td className="px-4 py-3"><p className="font-medium">{d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[r.status] ?? 'bg-slate-100 text-slate-500'}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.in_time ? r.in_time.slice(0, 5) : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.out_time ? r.out_time.slice(0, 5) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
