import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, UserCheck, Receipt } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rota', label: 'Rota Calendar', icon: Calendar },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/carers', label: 'Carers', icon: UserCheck },
  { to: '/payroll', label: 'Payroll', icon: Receipt },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-hgc-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-hgc-800 font-bold text-sm">HGC</span>
              </div>
              <h1 className="text-lg font-semibold">Hamilton George Care</h1>
            </div>
            <span className="text-hgc-200 text-sm hidden sm:block">Rota Management</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-gray-200 hidden md:block">
          <div className="py-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-hgc-50 text-hgc-700 border-r-2 border-hgc-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2 py-1 text-xs ${
                    isActive ? 'text-hgc-600' : 'text-gray-500'
                  }`
                }
              >
                <Icon size={18} />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
