'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  role: 'admin' | 'carer'
  fullName: string | null
}

export default function Nav({ role, fullName }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/documents', label: 'Documents' },
    { href: '/admin/users', label: 'Team' },
    { href: '/admin/reports', label: 'Reports' },
  ]

  const carerLinks = [
    { href: '/carer', label: 'My Documents' },
  ]

  const links = role === 'admin' ? adminLinks : carerLinks

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1e3a5f' }}>
              <span className="text-white font-bold text-sm">HG</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-slate-900 text-sm leading-tight">Hamilton George Care</p>
              <p className="text-xs text-slate-400 capitalize">{role} Portal</p>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-500">{fullName}</span>
            <button
              onClick={signOut}
              className="hidden md:block px-3 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              Sign out
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {open
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === link.href
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="block w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-md"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
