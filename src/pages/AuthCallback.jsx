import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    // Supabase redirects here with tokens in the URL hash.
    // We listen for the auth event to determine where to send the user.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // Invite acceptance or password recovery → Set Password page
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          // Check URL hash for type=invite or type=recovery
          const hash = window.location.hash
          if (hash.includes('type=invite') || hash.includes('type=recovery')) {
            navigate('/set-password', { replace: true })
            return
          }
          // Normal sign-in → go to rota
          navigate('/rota', { replace: true })
        }
      }
    )

    // Also try to pick up the session from the URL hash directly
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      if (session) {
        const hash = window.location.hash
        if (hash.includes('type=invite') || hash.includes('type=recovery')) {
          navigate('/set-password', { replace: true })
        } else {
          navigate('/rota', { replace: true })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 text-sm font-medium mb-4">{error}</p>
          <a href="/login" className="text-hgc-600 hover:text-hgc-700 text-sm font-medium underline">
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-hgc-200 border-t-hgc-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
