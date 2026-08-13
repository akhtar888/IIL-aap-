import Layout from '../components/Layout'

const links = [
  { to: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/student/attendance', label: 'Attendance', icon: '📅' },
  { to: '/student/homework', label: 'Homework', icon: '📝' },
  { to: '/student/vocabulary', label: 'Vocabulary', icon: '📖' },
  { to: '/student/grammar', label: 'Grammar', icon: '✏️' },
  { to: '/student/ai-tutor', label: 'AI Tutor', icon: '🤖' },
  { to: '/student/courses', label: 'Courses', icon: '📚' },
  { to: '/student/mock-tests', label: 'Mock Tests', icon: '🧪' },
  { to: '/student/certificates', label: 'Certificates', icon: '🏅' },
]

export default function StudentLayout() {
  return <Layout brand="IIL Student" links={links} />
}
