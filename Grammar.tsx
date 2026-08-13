import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Rule { id: string; english_text: string; hindi_translation: string; explanation: string; example_en: string; example_hi: string }

export default function StudentGrammar() {
  const [rules, setRules] = useState<Rule[]>([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [learned, setLearned] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('grammar-learned') ?? '[]')))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('learning_content').select('*').eq('type', 'grammar').order('english_text')
      setRules(data ?? []); setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rules
    return rules.filter((r) => r.english_text.toLowerCase().includes(q) || r.hindi_translation.toLowerCase().includes(q) || r.explanation.toLowerCase().includes(q))
  }, [rules, search])

  function toggleLearned(id: string) {
    const next = new Set(learned)
    if (next.has(id)) next.delete(id); else next.add(id)
    setLearned(next)
    localStorage.setItem('grammar-learned', JSON.stringify([...next]))
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading grammar…</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Grammar Rules</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Har rule English + Hindi explanation ke saath — click karke detail dekho.</p>
      </header>
      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍  Search rule, Hindi ya explanation…"
          className="glass w-full px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
        <span className="glass shrink-0 rounded-xl px-4 py-3 text-sm font-semibold">✅ {learned.size}/{filtered.length} learned</span>
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📖</p><p className="mt-2 font-medium">Koi rule nahi mila</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded === r.id
            const isLearned = learned.has(r.id)
            return (
              <div key={r.id} className={`glass overflow-hidden transition ${isLearned ? 'ring-2 ring-emerald-400/60' : ''}`}>
                <button onClick={() => setExpanded(open ? null : r.id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <span onClick={(e) => { e.stopPropagation(); toggleLearned(r.id) }}
                      className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-sm transition ${isLearned ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>✓</span>
                    <div>
                      <h3 className="font-semibold">{r.english_text}</h3>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{r.hindi_translation}</p>
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {open && (
                  <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{r.explanation}</p>
                    <div className="mt-3 space-y-1 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900/60">
                      <p className="font-medium text-slate-700 dark:text-slate-200">💬 {r.example_en}</p>
                      <p className="text-slate-400">{r.example_hi}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
