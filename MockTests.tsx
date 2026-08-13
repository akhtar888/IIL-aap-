import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Question { q: string; options: string[]; answer: number }
interface MockTest { id: string; title: string; passing_score: number; questions: Question[] }
interface Attempt { test_id: string; score: number; passed: boolean; attempted_at: string }

export default function StudentMockTests() {
  const { user } = useAuth()
  const [tests, setTests] = useState<MockTest[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [active, setActive] = useState<MockTest | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from('mock_tests').select('*'),
      supabase.from('test_attempts').select('test_id, score, passed, attempted_at').eq('student_id', user!.id),
    ])
    setTests(t ?? []); setAttempts(a ?? []); setLoading(false)
  }
  useEffect(() => { if (user) load() }, [user])

  const best = useMemo(() => {
    const m: Record<string, number> = {}
    for (const at of attempts) m[at.test_id] = Math.max(m[at.test_id] ?? 0, at.score)
    return m
  }, [attempts])

  function start(t: MockTest) { setActive(t); setAnswers({}); setCurrent(0); setResult(null) }

  async function submitTest() {
    if (!active) return
    setSubmitting(true)
    let correct = 0
    active.questions.forEach((q, i) => { if (answers[i] === q.answer) correct++ })
    const score = Math.round((correct / active.questions.length) * 100)
    const passed = score >= active.passing_score
    await supabase.from('test_attempts').insert({ test_id: active.id, student_id: user!.id, score, passed })
    setResult({ score, passed }); setSubmitting(false); load()
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading tests…</div>

  if (active && !result) {
    const q = active.questions[current]
    const answered = Object.keys(answers).length
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActive(null)} className="text-sm text-slate-400 hover:text-slate-600">← All tests</button>
          <span className="text-sm font-medium">{answered}/{active.questions.length} answered</span>
        </div>
        <div className="glass p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Question {current + 1} of {active.questions.length}</p>
          <h2 className="mt-2 text-xl font-semibold">{q.q}</h2>
          <div className="mt-5 space-y-2">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => setAnswers((a) => ({ ...a, [current]: i }))}
                className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  answers[current] === i ? 'border-indigo-500 bg-indigo-50 font-medium dark:bg-indigo-950/40' : 'border-slate-200 bg-white/60 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/60'}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 disabled:opacity-30">← Back</button>
            {current < active.questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Next →</button>
            ) : (
              <button onClick={submitTest} disabled={submitting || answered < active.questions.length}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-40">
                {submitting ? 'Submitting…' : 'Submit test'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (active && result) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="glass p-10 text-center">
          <p className="text-5xl">{result.passed ? '🎉' : '💪'}</p>
          <h2 className="mt-3 text-2xl font-bold">{result.score}%</h2>
          <p className={`mt-1 font-semibold ${result.passed ? 'text-emerald-500' : 'text-red-500'}`}>{result.passed ? `Passed! (${active.passing_score}% required)` : `Try again — ${active.passing_score}% required`}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => start(active)} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Retake</button>
            <button onClick={() => setActive(null)} className="glass px-5 py-2 text-sm font-medium">All tests</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mock Tests</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Real exam format — practice karo, apna level jano.</p>
      </header>
      {tests.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📝</p><p className="mt-2 font-medium">Abhi koi test available nahi</p></div>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => {
            const b = best[t.id]
            return (
              <div key={t.id} className="glass flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.questions.length} questions · Pass: {t.passing_score}%</p>
                  {b !== undefined && <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">Best score: {b}%</p>}
                </div>
                <button onClick={() => start(t)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:brightness-110">
                  {b === undefined ? 'Start test' : 'Retake'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
