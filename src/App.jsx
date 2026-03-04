import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RotaCalendar from './pages/RotaCalendar'
import Clients from './pages/Clients'
import Carers from './pages/Carers'
import Payroll from './pages/Payroll'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rota" element={<RotaCalendar />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/carers" element={<Carers />} />
        <Route path="/payroll" element={<Payroll />} />
      </Routes>
    </Layout>
  )
}
