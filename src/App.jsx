import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import RotaCalendar from './pages/RotaCalendar'
import Clients from './pages/Clients'
import Carers from './pages/Carers'
import Payroll from './pages/Payroll'
import Team from './pages/Team'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="w-8 h-8 border-3 border-hgc-200 border-t-hgc-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/rota" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/rota" replace />} />
                <Route path="/rota" element={<RotaCalendar />} />
                <Route path="/carers" element={<Carers />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/team" element={<Team />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
