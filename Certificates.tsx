import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface Cert { id: string; issued_at: string; course: { title: string } | null }

export default function StudentCertificates() {
  const { profile } = useAuth()
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('certificates')
        .select('id, issued_at, course: courses(title)').order('issued_at', { ascending: false })
      setCerts(data ?? []); setLoading(false)
    })()
  }, [])

  async function download(c: Cert) {
    if (!certRef.current) return
    setDownloading(c.id)
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF('l', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width)
    pdf.save(`IIL-${(c.course?.title ?? 'Course').replace(/\s+/g, '-')}-certificate.pdf`)
    setDownloading(null)
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading certificates…</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Course 100% complete karo — certificate apne aap issue ho jata hai.</p>
      </header>

      {certs.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">🏅</p><p className="mt-2 font-medium">Abhi koi certificate nahi</p><p className="text-sm text-slate-500 dark:text-slate-400">Koi bhi course 100% karo, yahan mil jayega.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <div key={c.id} className="glass overflow-hidden">
              <div className="border-b border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20">
                <p className="text-4xl">🏅</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-amber-600">Certificate of Completion</p>
                <p className="mt-3 text-lg font-bold">{c.course?.title ?? 'Course'}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Issued: {new Date(c.issued_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="p-4 text-center">
                <button onClick={() => download(c)} disabled={downloading === c.id}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50">
                  {downloading === c.id ? 'Generating…' : '⬇ Download PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {certs[0] && (
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div ref={certRef} className="flex h-[210mm] w-[297mm] flex-col items-center justify-center bg-white p-16 text-center">
            <p className="text-5xl">🏅</p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.4em] text-indigo-500">IIL English Speaking Institute</p>
            <p className="mt-10 text-xl font-medium text-slate-400">This certifies that</p>
            <p className="mt-2 text-4xl font-bold text-slate-800">{profile?.name ?? 'Student'}</p>
            <p className="mt-8 max-w-xl text-sm text-slate-500">has successfully completed the course <span className="font-semibold text-slate-700">{certs[0].course?.title}</span> and demonstrated proficiency in English communication.</p>
            <div className="mt-12 flex w-full max-w-md items-end justify-between text-xs text-slate-400">
              <div className="text-center"><div className="mx-auto mb-1 h-px w-40 bg-slate-300" />Director</div>
              <div className="text-center"><div className="mx-auto mb-1 h-px w-40 bg-slate-300" />Date: {new Date(certs[0].issued_at).toLocaleDateString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
