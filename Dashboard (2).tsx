import { useEffect, useState, useId } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface EnrollmentWithCourse {
  id: string; course_id: string; completed_lessons: number; total_lessons: number
  course: { title: string; description: string | null }
}

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [presentDays, setPresentDays] = useState(0)
  const [pendingHomework, setPendingHomework] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const monthStart = new Date(); monthStart.setDate(1)
      const today = new Date().toISOString().slice(0, 10)

      const { data: enr } = await supabase
        .from('enrollments')
        .select('id, course_id, completed_lessons, total_lessons, course: courses(title, description)')
        .eq('student_id', user.id)

      const { count: present } = await supabase
        .from('attendance').select('id', { count: 'exact', head: true })
        .eq('student_id', user.id).eq('status', 'present')
        .gte('date', monthStart.toISOString().slice(0, 10))

      const courseIds = (enr ?? []).map((e: EnrollmentWithCourse) => e.course_id).filter(Boolean)
      let pending = 0
      if (courseIds.length) {
        const { data: hw } = await supabase.from('homework').select('id').in('course_id', courseIds).gte('due_date', today)
        const { data: subs } = await supabase.from('submissions').select('homework_id').eq('student_id', user.id)
        const submitted = new Set((subs ?? []).map((s: any) => s.homework_id))
        pending = (hw ?? []).filter((h) => !submitted.has(h.id)).length
      }

      setEnrollments(enr ?? [])
      setPresentDays(present ?? 0)
      setPendingHomework(pending)
      setLoading(false)
    })()
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.name?.split(' ')[0] ?? 'Student'
  const overall = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.total_lessons ? e.completed_lessons / e.total_lessons : 0), 0) / enrollments.length * 100)
    : 0

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading dashboard…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}, {name} 👋</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Aaj bhi ek kadam English fluency ki taraf — keep going!</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass flex items-center gap-4 p-5"><span className="text-4xl">🔥</span><div><p className="text-2xl font-bold">{profile?.streak_count ?? 0}</p><p className="text-sm text-slate-500 dark:text-slate-400">day speaking streak</p></div></div>
        <div className="glass flex items-center gap-4 p-5"><span className="text-4xl">📅</span><div><p className="text-2xl font-bold">{presentDays}</p><p className="text-sm text-slate-500 dark:text-slate-400">days present this month</p></div></div>
        <div className="glass flex items-center gap-4 p-5"><span className="text-4xl">📝</span><div><p className="text-2xl font-bold">{pendingHomework}</p><p className="text-sm text-slate-500 dark:text-slate-400">homework pending</p></div></div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Your courses</h2>
        {enrollments.length === 0 ? (
          <div className="glass p-10 text-center"><p className="text-4xl">📚</p><p className="mt-2 font-medium">Abhi koi course enroll nahi hai</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <div key={e.id} className="glass flex items-center gap-5 p-5">
                <ProgressRing value={e.total_lessons ? Math.round((e.completed_lessons / e.total_lessons) * 100) : 0} />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{e.course?.title ?? 'Course'}</h3>
                  <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{e.course?.description}</p>
                  <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">{e.completed_lessons}/{e.total_lessons} lessons</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Overall progress</h2><span className="font-bold text-indigo-600 dark:text-indigo-400">{overall}%</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all" style={{ width: `${overall}%` }} />
        </div>
      </section>
    </div>
  )
}

function ProgressRing({ value, size = 96, stroke = 9 }: { value: number; size?: number; stroke?: number }) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-slate-200 dark:stroke-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round" stroke={`url(#${id})`} strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg font-bold">{pct}%</div>
    </div>
  )
}
