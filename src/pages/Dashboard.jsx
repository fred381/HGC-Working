import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Calendar, Users, UserCheck, Receipt, ArrowRight } from 'lucide-react'
import { MONTH_NAMES } from '../utils/dates'

export default function Dashboard() {
  const { clients, carers, assignments, getCarerMonthlyDays } = useApp()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const todayAssignments = assignments.filter(a => a.date === today)
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthAssignments = assignments.filter(a => a.date.startsWith(monthPrefix))
  const uniqueMonthDays = new Set(monthAssignments.map(a => a.date)).size

  const topCarers = useMemo(() => {
    return carers
      .map(c => ({
        ...c,
        daysWorked: getCarerMonthlyDays(c.id, year, month),
      }))
      .sort((a, b) => b.daysWorked - a.daysWorked)
      .slice(0, 5)
  }, [carers, year, month, getCarerMonthlyDays])

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          {MONTH_NAMES[month]} {year} — Hamilton George Care operations overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Clients"
          value={clients.length}
          link="/clients"
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Carers"
          value={carers.length}
          link="/carers"
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Today's Assignments"
          value={todayAssignments.length}
          link="/rota"
          color="purple"
        />
        <StatCard
          icon={Receipt}
          label="Days Rostered"
          value={uniqueMonthDays}
          subtitle="this month"
          link="/rota"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Today's Assignments</h3>
            <Link to="/rota" className="text-xs text-hgc-600 hover:text-hgc-700 flex items-center gap-1">
              View Rota <ArrowRight size={12} />
            </Link>
          </div>
          {todayAssignments.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No assignments scheduled for today
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayAssignments.map(a => {
                const client = clients.find(c => c.id === a.clientId)
                const carer = carers.find(c => c.id === a.carerId)
                return (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                    <UserCheck size={16} className="text-hgc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {carer?.name || 'Unknown Carer'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Assigned to {client?.name || 'Unknown Client'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top carers this month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Top Carers — {MONTH_NAMES[month]}
            </h3>
            <Link to="/payroll" className="text-xs text-hgc-600 hover:text-hgc-700 flex items-center gap-1">
              Payroll <ArrowRight size={12} />
            </Link>
          </div>
          {topCarers.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No carers registered yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {topCarers.map(carer => (
                <div key={carer.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-700">{carer.name}</span>
                  <span className={`text-sm font-semibold ${
                    carer.daysWorked > 0 ? 'text-hgc-700' : 'text-gray-400'
                  }`}>
                    {carer.daysWorked} day{carer.daysWorked !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick start guide for empty state */}
      {clients.length === 0 && carers.length === 0 && (
        <div className="mt-8 bg-hgc-50 border border-hgc-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-hgc-900 mb-3">Getting Started</h3>
          <ol className="space-y-2 text-sm text-hgc-800">
            <li className="flex items-start gap-2">
              <span className="bg-hgc-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <span>Add your <Link to="/clients" className="font-semibold underline">clients</Link> — the people who receive care</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-hgc-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <span>Add your <Link to="/carers" className="font-semibold underline">carers</Link> — set their daily rate and allowances</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-hgc-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <span>Build your <Link to="/rota" className="font-semibold underline">rota</Link> — assign carers to clients on the calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-hgc-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <span>Download <Link to="/payroll" className="font-semibold underline">payroll</Link> sheets as Excel or CSV</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

function StatCard({ icon: Icon, label, value, subtitle, link, color }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">
        {label}
        {subtitle && <span className="text-xs"> ({subtitle})</span>}
      </p>
    </Link>
  )
}
