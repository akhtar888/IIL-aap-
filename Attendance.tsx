import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Student { id: string; name: string; email: string }
interface Entry { status: 'present' | 'absent' | 'late' | ''; in_time: string; out_time: string }

const STATUS = ['present', 'absent', 'late'] as const
const statusColor: Record<string, string> = {
  present: 'bg-emerald-500 text-white', absent: 'bg-red-500 text-white', late: 'bg-amber-500 text-white',
}

export default function TeacherAttendance() {
  const { user } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<Student[]>([])
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('teacher_students')
        .select('student_id, student: profiles(id, name, email)').eq('teacher_id', user.id)
      setStudents((data ?? []).map((d: any) => d.student)); setLoading(false)
    })()
  }, [user])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('attendance')
        .select('student_id, status, in_time, out_time').eq('date', date).eq('teacher_id', user.id)
      const map: Record<string, Entry> = {}
      for (const d of data ?? []) map[d.student_id] = { status: d.status, in_time: d.in_time ?? '', out_time: d.out_time ?? '' }
      setEntries(map)
    })()
  }, [date, user])

  function setEntry(id: string, patch: Partial<Entry>) {
    setEntries((prev) => ({ ...prev, [id]: { status: '', in_time: '', out_time: '', ...prev[id], ...patch } }))
  }

  async function save(student: Student) {
    const e = entries[student.id]
    if (!e?.status) return
    setSavingId(student.id); setMsg(null)
    const { error } = await supabase.from('attendance').upsert(
      { student_id: student.id, teacher_id: user!.id, date, status: e.status, in_time: e.in_time || null, out_time: e.out_time || null },
      { onConflict: 'student_id,date' }
    )
    if (error) setMsg(`Error: ${error.message}`)
    else setMsg(`${student.name} — attendance saved ✅`)
    setSavingId(null)
  }

  async function saveAll() {
    setMsg(null)
    const rows = students.filter((s) => entries[s.id]?.status).map((s) => ({
      student_id: s.id, teacher_id: user!.id, date, status: entries[s.id].status,
      in_time: entries[s.id].in_time || null, out_time: entries[s.id].out_time || null,
    }))
    if (!rows.length) return
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
    setMsg(error ? `Error: ${error.message}` : `${rows.length} students saved ✅`)
  }

  function markAllPresent() {
    setEntries((prev) => {
      const next = { ...prev }
      for (const s of students) next[s.id] = { status: 'present', in_time: next[s.id]?.in_time ?? '09:00', out_time: next[s.id]?.out_time ?? '' }
      return next
    })
  }

  const counts = {
    present: students.filter((s) => entries[s.id]?.status === 'present').length,
    absent: students.filter((s) => entries[s.id]?.status === 'absent').length,
    late: students.filter((s) => entries[s.id]?.status === 'late').length,
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading…</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Date chuno, apne students ki marking karo.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={markAllPresent} className="glass px-4 py-2.5 text-sm font-semibold transition hover:bg-white/70 dark:hover:bg-white/10">All present</button>
          <button onClick={saveAll} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:brightness-110">Save all</button>
        </div>
      </header>

      {msg && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{msg}</div>}

      <div className="glass flex flex-wrap gap-4 px-5 py-4 text-sm">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Present: {counts.present}</span>
        <span className="font-medium text-red-500">Absent: {counts.absent}</span>
        <span className="font-medium text-amber-500">Late: {counts.late}</span>
      </div>

      {students.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">👥</p><p className="mt-2 font-medium">Aapko koi student assign nahi hai</p><p className="text-sm text-slate-500 dark:text-slate-400">Admin se teacher_students assignment karwao.</p></div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const e = entries[s.id] ?? { status: '', in_time: '', out_time: '' }
            return (
              <div key={s.id} className="glass flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{s.email}</p>
                </div>
                <div className="flex overflow-hidden rounded-xl">
                  {STATUS.map((st) => (
                    <button key={st} onClick={() => setEntry(s.id, { status: st })}
                      className={`px-4 py-2 text-sm font-medium capitalize transition ${e.status === st ? statusColor[st] : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                      {st}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">In</label>
                  <input type="time" value={e.in_time} onChange={(ev) => setEntry(s.id, { in_time: ev.target.value })}
                    className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
                  <label className="text-xs text-slate-500 dark:text-slate-400">Out</label>
                  <input type="time" value={e.out_time} onChange={(ev) => setEntry(s.id, { out_time: ev.target.value })}
                    className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
                </div>
                <button onClick={() => save(s)} disabled={savingId === s.id || !e.status}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  {savingId === s.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
