import { Navigate } from 'react-router-dom'
import { useAuth, type Role } from '../hooks/useAuth'

export default function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center">Loading…</div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== role && profile.role !== 'admin') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
