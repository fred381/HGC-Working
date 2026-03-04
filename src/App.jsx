import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RotaCalendar from './pages/RotaCalendar'
import Clients from './pages/Clients'
import Carers from './pages/Carers'
import Payroll from './pages/Payroll'
import Team from './pages/Team'

export default function App() {
  return (
    <Routes>
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
