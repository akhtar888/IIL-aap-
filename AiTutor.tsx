import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Feedback {
  reply: string
  grammar: { error: string; correction: string; explanation_hi: string }
  vocab: { word: string; upgrade: string; explanation_hi: string }
}

const prompts = ['Tell me about your day', 'Order food at a restaurant', 'Introduce yourself', 'Describe your dream job']

export default function AiTutor() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError("Browser speech support nahi hai. Chrome ya Edge use karo."); return }
    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setTranscript(text); handleSpeechSubmit(text)
    }
    recognition.onerror = () => { setIsRecording(false); setError('Microphone error. Phir try karo.') }
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
  }, [])

  const startRecording = () => { setError(''); setTranscript(''); setFeedback(null); setIsRecording(true); recognitionRef.current?.start() }
  const stopRecording = () => { setIsRecording(false); recognitionRef.current?.stop() }

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.9
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
  }

  const handleSpeechSubmit = async (text: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('tutor', { body: { text } })
      if (error) throw error
      setFeedback(data); speak(data.reply)
      await supabase.rpc('bump_streak')
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">AI Tutor</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Free speaking coach — mic dabao, bolo, feedback pao (English + Hindi).</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button key={p} onClick={() => speak(p)} className="glass rounded-full px-3 py-1.5 text-sm transition hover:bg-white/40 dark:hover:bg-white/10">💡 {p}</button>
        ))}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
      <div className="glass flex flex-col items-center p-10 text-center">
        <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
          className={`h-24 w-24 rounded-full text-4xl shadow-xl transition-all ${isRecording ? 'scale-110 animate-pulse bg-red-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105'}`}>🎤</button>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{isRecording ? 'Listening… release to send' : 'Hold to speak'}</p>
        {transcript && <p className="mt-4 font-medium">"{transcript}"</p>}
      </div>
      {loading && <p className="animate-pulse text-center text-slate-500">AI analyze kar raha hai…</p>}
      {feedback && (
        <div className="space-y-4">
          <div className="glass border-l-4 border-indigo-500 p-5">
            <h3 className="text-xs font-bold uppercase text-indigo-500">Tutor reply</h3>
            <p className="mt-2 text-lg">{feedback.reply}</p>
            <button onClick={() => speak(feedback.reply)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">🔊 Play again</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {feedback.grammar?.error && (
              <div className="glass border-t-4 border-amber-500 p-5">
                <h3 className="font-bold">📝 Grammar fix</h3>
                <p className="mt-2 text-red-400 line-through">{feedback.grammar.error}</p>
                <p className="font-medium text-emerald-500">{feedback.grammar.correction}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feedback.grammar.explanation_hi}</p>
              </div>
            )}
            {feedback.vocab?.upgrade && (
              <div className="glass border-t-4 border-blue-500 p-5">
                <h3 className="font-bold">✨ Vocab upgrade</h3>
                <p className="mt-2 text-slate-500">Instead of "{feedback.vocab.word}"</p>
                <p className="font-medium text-blue-600 dark:text-blue-400">Use "{feedback.vocab.upgrade}"</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feedback.vocab.explanation_hi}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
