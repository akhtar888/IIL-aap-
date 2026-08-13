import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Stat { label: string; value: number | string; icon: string; sub?: string }

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [streakTop, setStreakTop] = useState<{ name: string; streak_count: number }[]>([])

  useEffect(() => {
    ;(async () => {
      const monthStart = new Date(); monthStart.setDate(1)
      const [profiles, courses, att, hw, subs, attempts, certs] = await Promise.all([
        supabase.from('profiles').select('role, streak_count, name'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('status').gte('date', monthStart.toISOString().slice(0, 10)),
        supabase.from('homework').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('score'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
      ])

      const rows = profiles.data ?? []
      const students = rows.filter((p: any) => p.role === 'student').length
      const teachers = rows.filter((p: any) => p.role === 'teacher').length
      const admins = rows.filter((p: any) => p.role === 'admin').length

      const attRows = att.data ?? []
      const present = attRows.filter((a: any) => a.status !== 'absent').length
      const attRate = attRows.length ? Math.round((present / attRows.length) * 100) : null

      const totalHw = hw.count ?? 0
      const hwRate = totalHw ? Math.round(((subs.count ?? 0) / totalHw) * 100) : null

      const scores = (attempts.data ?? []).map((t: any) => t.score)
      const testAvg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

      setStreakTop((rows as any[]).filter((p) => p.role === 'student').sort((a, b) => b.streak_count - a.streak_count).slice(0, 5))

      setStats([
        { label: 'Students', value: students, icon: '🎓', sub: `${admins} admin · ${teachers} teachers` },
        { label: 'Courses', value: courses.count ?? 0, icon: '📚' },
        { label: 'Attendance (this month)', value: attRate !== null ? `${attRate}%` : '—', icon: '📅' },
        { label: 'Homework submitted', value: hwRate !== null ? `${hwRate}%` : '—', icon: '📝' },
        { label: 'Avg test score', value: testAvg !== null ? `${testAvg}%` : '—', icon: '🧪' },
        { label: 'Certificates issued', value: certs.count ?? 0, icon: '🏆' },
      ])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading analytics…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Institute ka overall health ek nazar mein.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
            {s.sub && <p className="mt-1 text-xs text-slate-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold">🔥 Top streaks</h2>
        {streakTop.length === 0 ? (
          <p className="text-sm text-slate-400">Abhi koi streak data nahi.</p>
        ) : (
          <div className="space-y-2">
            {streakTop.map((s, i) => (
              <div key={s.name + i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900/60">
                <span className="font-medium">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {s.name}</span>
                <span className="font-bold text-amber-500">🔥 {s.streak_count} days</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
