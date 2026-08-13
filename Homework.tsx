import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Course { id: string; title: string }
interface Homework { id: string; title: string; description: string; due_date: string; course: { title: string } | null }
interface Submission { id: string; content: string; grade: string | null; status: string; submitted_at: string; homework_id: string; student: { name: string } | null }

export default function TeacherHomework() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
  const [expanded, setExpanded] = useState<string | null>(null)
  const [subs, setSubs] = useState<Record<string, Submission[]>>({})
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadHomework() {
    const { data } = await supabase.from('homework')
      .select('id, title, description, due_date, course: courses(title)')
      .eq('teacher_id', user!.id).order('due_date', { ascending: false })
    setHomework(data ?? [])
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: c } = await supabase.from('courses').select('id, title')
      setCourses(c ?? []); await loadHomework(); setLoading(false)
    })()
  }, [user])

  async function assign(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !title.trim()) return
    const { error } = await supabase.from('homework').insert({
      course_id: courseId, teacher_id: user!.id, title: title.trim(), description: description.trim(), due_date: dueDate,
    })
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: `Homework "${title}" assign ho gaya ✅` }); setTitle(''); setDescription(''); setCourseId(''); loadHomework() }
  }

  async function toggleSubs(hwId: string) {
    if (expanded === hwId) { setExpanded(null); return }
    setExpanded(hwId)
    const { data } = await supabase.from('submissions')
      .select('id, content, grade, status, submitted_at, homework_id, student: profiles(name)')
      .eq('homework_id', hwId).order('submitted_at', { ascending: true })
    const list = data ?? []
    setSubs((prev) => ({ ...prev, [hwId]: list }))
    const g: Record<string, string> = {}
    for (const s of list) g[s.id] = s.grade ?? ''
    setGrades((prev) => ({ ...prev, ...g }))
  }

  async function saveGrade(s: Submission) {
    const grade = (grades[s.id] ?? '').trim()
    const { error } = await supabase.from('submissions').update({ grade, status: 'graded' }).eq('id', s.id)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: `Grade "${grade}" save ho gaya ✅` }); toggleSubs(expanded!) }
  }

  async function deleteHw(h: Homework) {
    if (!confirm(`"${h.title}" delete karo?`)) return
    const { error } = await supabase.from('homework').delete().eq('id', h.id)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: 'Homework deleted 🗑️' }); loadHomework() }
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Assign karo, submissions dekho, grades do.</p>
      </header>
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>{msg.text}</div>}

      <form onSubmit={assign} className="glass grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
        <input required placeholder="Homework title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <select required value={courseId} onChange={(e) => setCourseId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70">
          <option value="">Select course…</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input placeholder="Description / instructions" value={description} onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <div className="flex gap-2">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:brightness-110">Assign</button>
        </div>
      </form>

      {homework.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📝</p><p className="mt-2 font-medium">Abhi koi homework assign nahi kiya</p></div>
      ) : (
        <div className="space-y-3">
          {homework.map((h) => (
            <div key={h.id} className="glass overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{h.course?.title ?? 'Course'}</span>
                  <h3 className="mt-0.5 font-semibold">{h.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{h.description}</p>
                  <p className="mt-1 text-xs text-slate-400">Due: {h.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleSubs(h.id)}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300">
                    Submissions ({subs[h.id]?.length ?? 0})
                  </button>
                  <button onClick={() => deleteHw(h)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-100 dark:bg-red-950/40">Delete</button>
                </div>
              </div>

              {expanded === h.id && (
                <div className="space-y-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  {(subs[h.id] ?? []).length === 0 ? (
                    <p className="text-sm text-slate-400">Abhi koi submission nahi aaya.</p>
                  ) : (
                    (subs[h.id] ?? []).map((s) => (
                      <div key={s.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
                        <p className="text-sm font-semibold">{s.student?.name ?? 'Student'}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.content}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.status === 'graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                            {s.status === 'graded' ? `Graded: ${s.grade}` : 'Pending'}
                          </span>
                          <input value={grades[s.id] ?? ''} onChange={(e) => setGrades((g) => ({ ...g, [s.id]: e.target.value }))}
                            placeholder="Grade (A/B/C…)"
                            className="w-28 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
                          <button onClick={() => saveGrade(s)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Save grade</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
