import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import RotaCalendar from './pages/RotaCalendar'
import Clients from './pages/Clients'
import Carers from './pages/Carers'
import Payroll from './pages/Payroll'
import Team from './pages/Team'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  const { loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="w-8 h-8 border-3 border-hgc-200 border-t-hgc-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={<Navigate to="/rota" replace />} />
      <Route
        path="/*"
        element={
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
        }
      />
    </Routes>
  )
}
