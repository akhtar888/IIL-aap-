import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Homework { id: string; title: string; description: string; due_date: string; course: { title: string } | null }
interface Submission { homework_id: string; content: string; grade: string | null; status: string; submitted_at: string }

export default function StudentHomework() {
  const { user } = useAuth()
  const [homework, setHomework] = useState<Homework[]>([])
  const [subs, setSubs] = useState<Record<string, Submission>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: enr } = await supabase.from('enrollments').select('course_id').eq('student_id', user.id)
      const courseIds = (enr ?? []).map((e: any) => e.course_id)
      let hw: Homework[] = []
      if (courseIds.length) {
        const { data } = await supabase.from('homework')
          .select('id, title, description, due_date, course: courses(title)')
          .in('course_id', courseIds).order('due_date')
        hw = data ?? []
      }
      const { data: subData } = await supabase.from('submissions')
        .select('homework_id, content, grade, status, submitted_at').eq('student_id', user.id)
      const map: Record<string, Submission> = {}
      for (const s of subData ?? []) map[s.homework_id] = s
      setHomework(hw); setSubs(map); setLoading(false)
    })()
  }, [user])

  const today = new Date().toISOString().slice(0, 10)

  const { pending, overdue, submitted } = useMemo(() => {
    const p: Homework[] = [], o: Homework[] = [], s: Homework[] = []
    for (const h of homework) {
      const sub = subs[h.id]
      if (sub && sub.status === 'submitted') s.push(h)
      else if (h.due_date < today) o.push(h)
      else p.push(h)
    }
    return { pending: p, overdue: o, submitted: s }
  }, [homework, subs, today])

  async function submit(h: Homework) {
    const content = (drafts[h.id] ?? '').trim()
    if (!content) return
    setSavingId(h.id); setMsg(null)
    const { error } = await supabase.from('submissions').upsert(
      { homework_id: h.id, student_id: user!.id, content, status: 'submitted', grade: null },
      { onConflict: 'homework_id,student_id' }
    )
    if (error) setMsg({ ok: false, text: error.message })
    else {
      setMsg({ ok: true, text: `"${h.title}" submit ho gaya ✅` })
      setDrafts((d) => ({ ...d, [h.id]: '' }))
      const { data } = await supabase.from('submissions')
        .select('homework_id, content, grade, status, submitted_at').eq('student_id', user!.id)
      const map: Record<string, Submission> = {}
      for (const s of data ?? []) map[s.homework_id] = s
      setSubs(map)
    }
    setSavingId(null)
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading homework…</div>

  function Card({ h }: { h: Homework }) {
    const sub = subs[h.id]
    const days = Math.ceil((new Date(h.due_date + 'T00:00:00').getTime() - Date.now()) / 86400000)
    const dueLabel = days > 0 ? `${days} din baaki` : days === 0 ? 'Aaj deadline hai' : `${Math.abs(days)} din overdue`
    const dueColor = days < 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-slate-400'
    return (
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">{h.course?.title ?? 'Course'}</span>
            <h3 className="mt-0.5 font-semibold">{h.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{h.description}</p>
          </div>
          <span className={`shrink-0 text-sm font-medium ${dueColor}`}>{dueLabel}</span>
        </div>
        {sub ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900/60">
            <p className="text-slate-700 dark:text-slate-200">{sub.content}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Submitted</span>
              {sub.grade && <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Grade: {sub.grade}</span>}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <textarea value={drafts[h.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [h.id]: e.target.value }))}
              placeholder="Apna answer yahan likho…" rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70" />
            <button onClick={() => submit(h)} disabled={savingId === h.id || !(drafts[h.id] ?? '').trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-40">
              {savingId === h.id ? 'Submitting…' : 'Submit homework'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Assign hua homework dekhna, submit karna, aur grade check karna.</p>
      </header>
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>{msg.text}</div>}
      {homework.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📝</p><p className="mt-2 font-medium">Abhi koi homework assign nahi hua</p></div>
      ) : (
        <>
          {pending.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Pending ({pending.length})</h2><div className="space-y-3">{pending.map((h) => <Card key={h.id} h={h} />)}</div></section>}
          {overdue.length > 0 && <section><h2 className="mb-3 text-lg font-semibold text-red-500">Overdue ({overdue.length})</h2><div className="space-y-3">{overdue.map((h) => <Card key={h.id} h={h} />)}</div></section>}
          {submitted.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Submitted ({submitted.length})</h2><div className="space-y-3">{submitted.map((h) => <Card key={h.id} h={h} />)}</div></section>}
        </>
      )}
    </div>
  )
}
