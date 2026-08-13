import Layout from '../components/Layout'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/courses', label: 'Courses', icon: '📚' },
  { to: '/admin/tests', label: 'Mock Tests', icon: '🧪' },
  { to: '/admin/assignments', label: 'Teacher Assignments', icon: '🔗' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
]

export default function AdminLayout() {
  return <Layout brand="IIL Admin" links={links} />
}
