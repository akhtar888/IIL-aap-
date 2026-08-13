import { NavLink } from 'react-router-dom'

const links = [
  { to: '/teacher/attendance', label: 'Mark attendance', icon: '📅' },
  { to: '/teacher/homework', label: 'Assign homework', icon: '📝' },
  { to: '/teacher/progress', label: 'Track progress', icon: '📈' },
]

export default function TeacherDashboard() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Apne assigned students ki attendance, homework aur progress yahin se.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className="glass flex flex-col items-center gap-2 p-8 text-center transition hover:-translate-y-1 hover:shadow-2xl">
            <span className="text-4xl">{l.icon}</span>
            <span className="font-semibold">{l.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
