import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Question { question: string; options: string[]; answer: number }
interface Course { id: string; title: string }
interface Test { id: string; title: string; questions: Question[]; passing_score: number; course_id: string | null }

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [passing, setPassing] = useState(60)
  const [questions, setQuestions] = useState<Question[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('mock_tests').select('*').order('created_at'),
      supabase.from('courses').select('id, title'),
    ])
    setTests(t ?? [])
    setCourses(c ?? [])
  }
  useEffect(() => { load() }, [])

  function addQuestion() {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], answer: 0 }])
  }
  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))
  }
  function updateOption(i: number, oi: number, val: string) {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, options: q.options.map((o, oIdx) => (oIdx === oi ? val : o)) } : q)))
  }

  function startEdit(t: Test) {
    setEditingId(t.id); setTitle(t.title); setCourseId(t.course_id ?? ''); setPassing(t.passing_score)
    setQuestions(t.questions?.length ? t.questions : [])
  }
  function reset() {
    setEditingId(null); setTitle(''); setCourseId(''); setPassing(60); setQuestions([])
  }

  async function handleSave() {
    if (!title.trim()) { setMsg({ ok: false, text: 'Title zaroori hai' }); return }
    const clean = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()))
    if (!clean.length) { setMsg({ ok: false, text: 'Kam se kam 1 valid question add karo' }); return }

    setBusy(true); setMsg(null)
    const payload = { title: title.trim(), course_id: courseId || null, passing_score: passing, questions: clean }
    const { error } = editingId
      ? await supabase.from('mock_tests').update(payload).eq('id', editingId)
      : await supabase.from('mock_tests').insert(payload)
    if (error) setMsg({ ok: false, text: error.message })
    else { setMsg({ ok: true, text: editingId ? 'Test update ho gaya ✅' : 'Test ban gaya ✅' }); reset(); load() }
    setBusy(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Ye test delete karna hai?')) return
    const { error } = await supabase.from('mock_tests').delete().eq('id', id)
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Test delete ho gaya' })
    load()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Tests create/edit/delete karo — students yahin se attempt karenge.</p>
      </header>

      {msg && <div className={`glass border-l-4 p-4 text-sm ${msg.ok ? 'border-emerald-500' : 'border-red-500'}`}>{msg.text}</div>}

      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold">{editingId ? '✏️ Test edit karo' : '🆕 Naya test banao'}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test title…" className="glass w-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="glass w-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">No course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input type="number" min={0} max={100} value={passing} onChange={(e) => setPassing(Number(e.target.value))} placeholder="Passing score %" className="glass w-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-500">Q{i + 1}</span>
                <input value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} placeholder="Question…" className="glass w-full flex-1 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((op, oi) => (
                  <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${q.answer === oi ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input type="radio" name={`q${i}`} checked={q.answer === oi} onChange={() => updateQuestion(i, { answer: oi })} />
                    <input value={op} onChange={(e) => updateOption(i, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="w-full bg-transparent outline-none" />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addQuestion} className="rounded-lg border border-dashed border-indigo-400 px-4 py-2 text-sm font-semibold text-indigo-500 transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10">+ Add question</button>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={busy} className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:opacity-40">
            {busy ? 'Saving…' : editingId ? 'Update test' : 'Create test'}
          </button>
          {editingId && <button onClick={reset} className="glass rounded-xl px-5 py-2.5 font-semibold">Cancel</button>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Existing tests ({tests.length})</h2>
        <div className="space-y-3">
          {tests.length === 0 && <div className="glass p-8 text-center text-slate-500">Abhi koi test nahi hai — upar se banao.</div>}
          {tests.map((t) => (
            <div key={t.id} className="glass flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.questions.length} questions · Passing {t.passing_score}% · {t.course_id ? (courses.find((c) => c.id === t.course_id)?.title ?? 'Course') : 'General'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="glass rounded-lg px-4 py-2 text-sm font-semibold transition hover:bg-indigo-600 hover:text-white">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
