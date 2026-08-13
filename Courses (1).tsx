import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface Course { id: string; title: string; description: string | null }
interface Enrollment { course_id: string; completed_lessons: number; total_lessons: number }

export default function StudentCourses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Record<string, Enrollment>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [{ data: c }, { data: e }] = await Promise.all([
        supabase.from('courses').select('id, title, description'),
        supabase.from('enrollments').select('course_id, completed_lessons, total_lessons').eq('student_id', user.id),
      ])
      setCourses(c ?? [])
      const map: Record<string, Enrollment> = {}
      for (const en of e ?? []) map[en.course_id] = en
      setEnrolled(map); setLoading(false)
    })()
  }, [user])

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading courses…</div>

  const myCourses = courses.filter((c) => enrolled[c.id])
  const browse = courses.filter((c) => !enrolled[c.id])

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Enrolled courses — progress track karo aur continue karo.</p>
        {myCourses.length === 0 ? (
          <div className="glass mt-6 p-10 text-center"><p className="text-4xl">📚</p><p className="mt-2 font-medium">Abhi koi course enroll nahi hai</p><p className="text-sm text-slate-500 dark:text-slate-400">Neeche available courses dekho — admin enroll karega.</p></div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {myCourses.map((c) => {
              const en = enrolled[c.id]
              const pct = en.total_lessons ? Math.round((en.completed_lessons / en.total_lessons) * 100) : 0
              return (
                <div key={c.id} className="glass flex flex-col p-6">
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>{en.completed_lessons}/{en.total_lessons} lessons</span><span className="font-bold text-indigo-500">{pct}%</span></div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <button onClick={() => navigate('/student/homework')}
                    className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110">
                    {pct === 100 ? 'Review homework →' : 'Continue learning →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Available Courses</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ye courses institute mein hain — enroll ke liye admin se baat karo.</p>
        {browse.length === 0 ? (
          <p className="glass mt-4 p-8 text-center text-sm text-slate-400">Sab courses enroll ho chuke hain 🎉</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {browse.map((c) => (
              <div key={c.id} className="glass flex flex-col p-5 opacity-90 transition hover:-translate-y-0.5 hover:shadow-2xl">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{c.title}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">Available</span>
                </div>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                <button onClick={() => navigate('/student/courses')}
                  className="mt-4 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700">
                  Enroll (admin se) 🔒
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
