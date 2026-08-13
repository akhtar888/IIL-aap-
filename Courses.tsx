import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Course { id: string; title: string; description: string | null; enrollments: { student_id: string; student: { name: string; email: string } }[] }
interface Student { id: string; name: string; email: string }

export default function AdminCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addStudentId, setAddStudentId] = useState<string>('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('courses').select('id, title, description, enrollments(student_id, student: profiles(name, email))').order('created_at'),
      supabase.from('profiles').select('id, name, email').eq('role', 'student').order('name'),
    ])
    setCourses(c ?? []); setStudents(s ?? []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const { error } = await supabase.from('courses').insert({ title: title.trim(), description: description.trim(), created_by: user!.id })
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: `Course "${title}" ban gaya ✅` }); setTitle(''); setDescription(''); load() }
  }

  async function update(id: string) {
    const { error } = await supabase.from('courses').update({ title: editTitle.trim(), description: editDesc.trim() }).eq('id', id)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: 'Course updated ✅' }); setEditing(null); load() }
  }

  async function remove(c: Course) {
    if (!confirm(`"${c.title}" delete karo? Iske enrollments, homework aur content bhi delete honge.`)) return
    const { error } = await supabase.from('courses').delete().eq('id', c.id)
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: `"${c.title}" deleted 🗑️` })
    load()
  }

  async function assignStudent(courseId: string) {
    if (!addStudentId) return
    const { error } = await supabase.from('enrollments').insert({ student_id: addStudentId, course_id: courseId, completed_lessons: 0, total_lessons: 10 })
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: 'Student assign ho gaya ✅' }); setAddStudentId(''); load() }
  }

  async function unassignStudent(courseId: string, studentId: string) {
    const { error } = await supabase.from('enrollments').delete().eq('course_id', courseId).eq('student_id', studentId)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: 'Student remove ho gaya' }); load() }
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading courses…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Manage Courses</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Courses create/edit/delete karo aur students assign karo.</p>
      </header>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>{msg.text}</div>}

      <form onSubmit={create} className="glass grid grid-cols-1 gap-3 p-6 md:grid-cols-[1fr_2fr_auto]">
        <input required placeholder="Course title (e.g. Spoken English)" value={title} onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
        <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:brightness-110">+ Create</button>
      </form>

      {courses.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📚</p><p className="mt-2 font-medium">Abhi koi course nahi hai</p></div>
      ) : (
        <div className="space-y-4">
          {courses.map((c) => (
            <div key={c.id} className="glass overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="min-w-0 flex-1">
                  {editing === c.id ? (
                    <div className="flex flex-wrap gap-2">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
                      <button onClick={() => update(c.id)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white">Save</button>
                      <button onClick={() => setEditing(null)} className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium dark:bg-slate-700">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                      <p className="mt-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">{c.enrollments.length} students enrolled</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(c.id); setEditTitle(c.title); setEditDesc(c.description ?? '') }}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Edit</button>
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300">Students</button>
                  <button onClick={() => remove(c)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-100 dark:bg-red-950/40">Delete</button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {c.enrollments.map((en) => (
                      <span key={en.student_id} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800">
                        {en.student.name}
                        <button onClick={() => unassignStudent(c.id, en.student_id)} className="text-slate-400 transition hover:text-red-500">✕</button>
                      </span>
                    ))}
                    {c.enrollments.length === 0 && <span className="text-sm text-slate-400">Koi student assign nahi — neeche se add karo.</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <select value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70">
                      <option value="">Select student…</option>
                      {students.filter((s) => !c.enrollments.some((en) => en.student_id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                    <button onClick={() => assignStudent(c.id)} disabled={!addStudentId}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40">Assign</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
