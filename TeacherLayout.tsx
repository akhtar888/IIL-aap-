import Layout from '../components/Layout'

const links = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/teacher/attendance', label: 'Attendance', icon: '📅' },
  { to: '/teacher/homework', label: 'Homework', icon: '📝' },
  { to: '/teacher/progress', label: 'Progress', icon: '📈' },
]

export default function TeacherLayout() {
  return <Layout brand="IIL Teacher" links={links} />
}
