import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, Shield, ShieldOff, UserX, UserCheck, Mail, X, RefreshCw, Trash2, Clock } from 'lucide-react'

export default function Team() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' })
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendingId, setResendingId] = useState(null)

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const confirmedUsers = users.filter(u => u.confirmed)
  const pendingUsers = users.filter(u => !u.confirmed)
  const activeUsers = confirmedUsers.filter(u => u.active)
  const deactivatedUsers = confirmedUsers.filter(u => !u.active)

  const handleInvite = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setInviting(true)

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      const { error: inviteError } = await supabase.auth.signInWithOtp({
        email: inviteForm.email,
        options: {
          data: { name: inviteForm.name, role: 'carer' },
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      })

      if (inviteError) throw inviteError

      setSuccess(`Invitation sent to ${inviteForm.email}`)
      setInviteForm({ name: '', email: '' })
      setInviteOpen(false)

      // Refresh user list after short delay for the trigger to fire
      setTimeout(fetchUsers, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const handleResendInvite = async (user) => {
    setResendingId(user.id)
    setError('')
    setSuccess('')
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl,
        },
      })
      if (resendError) throw resendError

      // Update invited_at timestamp
      await supabase
        .from('profiles')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', user.id)

      setSuccess(`Invitation resent to ${user.email}`)
      setTimeout(fetchUsers, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setResendingId(null)
    }
  }

  const handleCancelInvite = async (user) => {
    if (!window.confirm(`Cancel the invitation for ${user.email}? This will remove their pending account.`)) return
    setError('')
    try {
      // Delete the profile — the auth user will remain but won't have access
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      if (deleteError) throw deleteError

      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSuccess(`Invitation for ${user.email} has been cancelled`)
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'carer' : 'admin'
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  const toggleActive = async (userId, currentActive) => {
    const { error } = await supabase
      .from('profiles')
      .update({ active: !currentActive })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u))
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeUsers.length} active member{activeUsers.length !== 1 ? 's' : ''}
            {pendingUsers.length > 0 && ` · ${pendingUsers.length} pending`}
            {deactivatedUsers.length > 0 && ` · ${deactivatedUsers.length} deactivated`}
          </p>
        </div>
        <button
          onClick={() => { setInviteOpen(true); setError(''); setSuccess('') }}
          className="inline-flex items-center gap-2 bg-hgc-600 hover:bg-hgc-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
        >
          <UserPlus size={16} />
          Invite team member
        </button>
      </div>

      {/* Success / error banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}
      {error && !inviteOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Invite team member</h2>
              <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hgc-600 focus:border-transparent"
                  placeholder="e.g. Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hgc-600 focus:border-transparent"
                  placeholder="jane@hamiltongeorgecare.com"
                />
              </div>

              <p className="text-xs text-gray-500">
                They'll receive an email with a magic link to set up their account. New users are assigned the Carer role by default.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-hgc-600 hover:bg-hgc-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {inviting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-hgc-200 border-t-hgc-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Pending Invitations ── */}
          {pendingUsers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">
                  Pending Invitations ({pendingUsers.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-100/50 border-b border-amber-200">
                      <th className="text-left px-4 py-2.5 font-medium text-amber-700">Email</th>
                      <th className="text-left px-4 py-2.5 font-medium text-amber-700">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium text-amber-700">Invited</th>
                      <th className="text-right px-4 py-2.5 font-medium text-amber-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {pendingUsers.map(u => (
                      <tr key={u.id} className="bg-white/50">
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3 text-gray-600">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {timeAgo(u.invited_at || u.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleResendInvite(u)}
                              disabled={resendingId === u.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                              title="Resend invite"
                            >
                              {resendingId === u.id ? (
                                <span className="inline-block w-3 h-3 border-2 border-amber-400/30 border-t-amber-600 rounded-full animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancelInvite(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Cancel invite"
                            >
                              <Trash2 size={12} />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Active users table ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {confirmedUsers.map((u) => (
                    <tr key={u.id} className={!u.active ? 'bg-gray-50/50 opacity-60' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'admin' ? <Shield size={12} /> : null}
                          {u.role === 'admin' ? 'Admin' : 'Carer'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleRole(u.id, u.role)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title={u.role === 'admin' ? 'Change to Carer' : 'Change to Admin'}
                          >
                            {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                          </button>
                          <button
                            onClick={() => toggleActive(u.id, u.active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.active
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={u.active ? 'Deactivate user' : 'Reactivate user'}
                          >
                            {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {confirmedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        No confirmed team members yet. Invite someone to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
