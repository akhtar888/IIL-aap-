import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface StudentSummary {
  id: string; name: string; email: string; streak: number
  courses: { title: string; completed: number; total: number }[]
  courseAvg: number; attendancePct: number
  homeworkGraded: number; homeworkTotal: number
  grades: string[]; testAvg: number | null; certCount: number
}

const pctColor = (v: number) => (v >= 75 ? 'text-emerald-500' : v >= 50 ? 'text-amber-500' : 'text-red-500')

function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={`h-full rounded-full ${color ?? 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export default function TeacherProgress() {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('teacher_students')
        .select('student_id, student: profiles(id, name, email, streak_count)').eq('teacher_id', user.id)

      const list: StudentSummary[] = []
      for (const row of data ?? []) {
        const s = row.student
        const [enr, att, subs, tests, certs] = await Promise.all([
          supabase.from('enrollments').select('completed_lessons, total_lessons, course: courses(title)').eq('student_id', s.id),
          supabase.from('attendance').select('status').eq('student_id', s.id),
          supabase.from('submissions').select('status, grade, homework: homework(teacher_id, title)').eq('student_id', s.id),
          supabase.from('test_attempts').select('score, test: mock_tests(title)').eq('student_id', s.id),
          supabase.from('certificates').select('id').eq('student_id', s.id),
        ])

        const courses = (enr.data ?? []).map((e: any) => ({ title: e.course?.title ?? 'Course', completed: e.completed_lessons, total: e.total_lessons }))
        const courseAvg = courses.length ? Math.round((courses.reduce((a, c) => a + (c.total ? c.completed / c.total : 0), 0) / courses.length) * 100) : 0

        const attRows = att.data ?? []
        const present = attRows.filter((a: any) => a.status === 'present').length
        const attendancePct = attRows.length ? Math.round((present / attRows.length) * 100) : 0

        const mySubs = (subs.data ?? []).filter((x: any) => x.homework?.teacher_id === user.id)
        const grades = mySubs.filter((x: any) => x.grade).map((x: any) => x.grade)

        const testScores = (tests.data ?? []).map((t: any) => t.score)
        const testAvg = testScores.length ? Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length) : null

        list.push({
          id: s.id, name: s.name, email: s.email, streak: s.streak_count ?? 0,
          courses, courseAvg, attendancePct,
          homeworkGraded: mySubs.filter((x: any) => x.status === 'graded').length,
          homeworkTotal: mySubs.length, grades, testAvg, certCount: (certs.data ?? []).length,
        })
      }
      setStudents(list); setLoading(false)
    })()
  }, [user])

  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500 dark:text-slate-400">Loading progress…</div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Apne assigned students ki overall progress — courses, attendance, homework, tests, certificates.</p>
      </header>

      {students.length === 0 ? (
        <div className="glass p-10 text-center"><p className="text-4xl">📊</p><p className="mt-2 font-medium">Aapko koi student assign nahi hai</p></div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const open = selected === s.id
            return (
              <div key={s.id} className="glass overflow-hidden">
                <button onClick={() => setSelected(open ? null : s.id)} className="w-full p-5 text-left">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{s.name} <span className="text-xs font-normal text-slate-400">({s.email})</span></p>
                      <div className="mt-1 flex items-center gap-2">
                        <Bar value={s.courseAvg} />
                        <span className={`shrink-0 text-sm font-bold ${pctColor(s.courseAvg)}`}>{s.courseAvg}%</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center text-sm">
                      <div><p className={`text-lg font-bold ${pctColor(s.attendancePct)}`}>{s.attendancePct}%</p><p className="text-xs text-slate-400">Attendance</p></div>
                      <div><p className="text-lg font-bold">{s.homeworkGraded}/{s.homeworkTotal}</p><p className="text-xs text-slate-400">HW graded</p></div>
                      <div><p className="text-lg font-bold">{s.testAvg ?? '—'}</p><p className="text-xs text-slate-400">Test avg</p></div>
                      <div><p className="text-lg font-bold">🔥 {s.streak}</p><p className="text-xs text-slate-400">Streak</p></div>
                      <div><p className="text-lg font-bold">🏅 {s.certCount}</p><p className="text-xs text-slate-400">Certs</p></div>
                    </div>
                    <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>

                {open && (
                  <div className="grid grid-cols-1 gap-6 border-t border-slate-100 px-5 py-5 dark:border-slate-800 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Courses</h3>
                      {s.courses.length === 0 ? <p className="text-sm text-slate-400">Koi course nahi</p> : (
                        <div className="space-y-3">
                          {s.courses.map((c, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{c.title}</span>
                                <span className="text-slate-400">{c.completed}/{c.total} · {c.total ? Math.round((c.completed / c.total) * 100) : 0}%</span>
                              </div>
                              <Bar value={c.total ? (c.completed / c.total) * 100 : 0} />
                            </div>
                          ))}
                        </div>
                      )}
                      {s.certCount > 0 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">🏅 {s.certCount} certificate issued</p>}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Homework</h3>
                        <p className="text-sm">Graded: <span className="font-semibold">{s.homeworkGraded}/{s.homeworkTotal}</span>
                          {s.grades.length > 0 && <span className="ml-2 text-slate-400">Grades: {s.grades.join(', ')}</span>}</p>
                      </div>
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Mock Tests</h3>
                        {s.testAvg === null ? <p className="text-sm text-slate-400">Abhi koi test nahi diya</p> : <p className="text-sm">Average score: <span className="font-semibold">{s.testAvg}%</span></p>}
                      </div>
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
