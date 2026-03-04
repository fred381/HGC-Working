import { NavLink } from 'react-router-dom'
import { Calendar, Users, UserCheck, Receipt } from 'lucide-react'

const navItems = [
  { to: '/rota', label: 'Rota', icon: Calendar },
  { to: '/carers', label: 'Carers', icon: UserCheck },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/payroll', label: 'Payroll', icon: Receipt },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="bg-hgc-800 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo / brand */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                <span className="text-hgc-800 font-bold text-sm">HGC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white text-sm font-semibold leading-tight">Hamilton George Care</h1>
                <p className="text-hgc-300 text-[11px] leading-tight">Rota Management</p>
              </div>
            </NavLink>

            {/* ── Desktop navigation ── */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-hgc-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right side placeholder */}
            <div className="w-8 md:hidden" />
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex justify-around py-1.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive ? 'text-hgc-600' : 'text-gray-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
