import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AdminRoute() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user is staff or superuser
  if (!user?.is_staff && !user?.is_superuser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
