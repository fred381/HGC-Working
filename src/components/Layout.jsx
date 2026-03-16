import { NavLink } from 'react-router-dom'
import { Calendar, Users, UserCheck, Receipt, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const allNavItems = [
  { to: '/rota', label: 'Rota', icon: Calendar, roles: ['admin', 'carer'] },
  { to: '/carers', label: 'Carers', icon: UserCheck, roles: ['admin'] },
  { to: '/clients', label: 'Clients', icon: Users, roles: ['admin'] },
  { to: '/payroll', label: 'Payroll', icon: Receipt, roles: ['admin'] },
  { to: '/team', label: 'Team', icon: ShieldCheck, roles: ['admin'] },
]

export default function Layout({ children }) {
  const { profile, loading, signOut } = useAuth()
  // While auth is loading, show all nav items to avoid flash of restricted UI
  // Once loaded, use the actual role (default to admin if no profile/no auth)
  const userRole = loading ? 'admin' : (profile?.role || 'admin')
  const visibleNavItems = allNavItems.filter(item => item.roles.includes(userRole))

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="bg-hgc-800 border-b border-hgc-900/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / brand */}
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-hgc-800 font-bold text-sm tracking-tight">HGC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white text-[15px] font-semibold leading-tight tracking-tight">
                  Hamilton George Care
                </h1>
                <p className="text-hgc-300 text-[11px] leading-tight font-medium tracking-wide uppercase">
                  Rota Manager
                </p>
              </div>
            </NavLink>

            {/* ── Desktop navigation ── */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-hgc-600 text-white shadow-sm shadow-hgc-900/30'
                        : 'text-hgc-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Sign out */}
            {profile && (
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-hgc-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around py-1.5 px-2">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  isActive ? 'text-hgc-600' : 'text-gray-400 active:text-gray-600'
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
