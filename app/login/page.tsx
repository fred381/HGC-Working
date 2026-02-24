'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Get role to redirect appropriately
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/admin' : '/carer')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ backgroundColor: '#1e3a5f' }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: '#1e3a5f' }}>HG</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Hamilton George Care</p>
              <p className="text-blue-300 text-sm">Policy Platform</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-white text-3xl font-bold mb-4 leading-tight">
            Keeping your team informed and compliant
          </h2>
          <ul className="space-y-3">
            {[
              'AI-enhanced policy documents',
              'Track who has read each document',
              'Knowledge check quizzes',
              'Automated email notifications',
              'Compliance reporting',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} Hamilton George Care</p>
      </div>

      {/* Login panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e3a5f' }}>
              <span className="text-white font-bold">HG</span>
            </div>
            <p className="font-bold text-slate-800">Hamilton George Care</p>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in</h1>
          <p className="text-slate-500 mb-8">Enter your email and password to access the platform.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                style={{ '--tw-ring-color': '#1e3a5f' } as React.CSSProperties}
                placeholder="you@hamiltongeorgecare.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-white font-semibold rounded-lg transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Contact your manager if you need account access.
          </p>
        </div>
      </div>
    </div>
  )
}
