import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Vocab { id: string; english_text: string; hindi_translation: string; explanation: string; example_en: string; example_hi: string }

export default function StudentVocabulary() {
  const [words, setWords] = useState<Vocab[]>([])
  const [search, setSearch] = useState('')
  const [practice, setPractice] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('learning_content').select('*').eq('type', 'vocab').order('english_text')
      setWords(data ?? []); setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return words
    return words.filter((w) => w.english_text.toLowerCase().includes(q) || w.hindi_translation.toLowerCase().includes(q) || w.explanation.toLowerCase().includes(q))
  }, [words, search])

  function speak(word: string) {
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'; u.rate = 0.85
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading vocabulary…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Roz 5 naye words — meaning English + Hindi dono mein.</p>
        </div>
        <button onClick={() => setPractice(!practice)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${practice ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'glass text-slate-600 dark:text-slate-300'}`}>
          {practice ? 'Practice mode: ON' : 'Practice mode: OFF'}
        </button>
      </header>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍  Search English, Hindi ya explanation…"
        className="glass w-full px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} words {practice && '· practice mode mein Hindi chhupi hai — card par click karke dekho'}</p>

      {filtered.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">🔎</p><p className="mt-2 font-medium">Koi word nahi mila</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <div key={w.id} onClick={() => setPractice((p) => !p)} className="glass group cursor-pointer p-5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold">{w.english_text}</h3>
                <button onClick={(e) => { e.stopPropagation(); speak(w.english_text) }}
                  className="rounded-lg px-2 py-1 text-lg transition hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Hear pronunciation">🔊</button>
              </div>
              {!practice ? (
                <>
                  <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-400">{w.hindi_translation}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{w.explanation}</p>
                </>
              ) : (
                <p className="mt-2 text-sm italic text-slate-400">Click karke translation dekho 🤫</p>
              )}
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-300">💬 {w.example_en}</p>
                <p className="text-slate-400">{w.example_hi}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
