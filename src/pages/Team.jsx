import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { UserPlus, Shield, ShieldOff, UserX, UserCheck, KeyRound, X, RefreshCw, Trash2, Clock } from 'lucide-react'

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

export default function Team() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'carer' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendingId, setResendingId] = useState(null)
  const [resettingId, setResettingId] = useState(null)

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  // A user is "pending" if they have never set a password (no confirmed_at from auth).
  // We track this with the `confirmed` column on profiles.
  const activeUsers = users.filter(u => u.confirmed && u.active)
  const pendingUsers = users.filter(u => !u.confirmed)

  // ── Add Team Member (invite via Supabase Admin API) ──
  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    if (!supabaseAdmin) {
      setError('Admin client not configured. Set VITE_SUPABASE_SERVICE_ROLE_KEY in your environment.')
      setSubmitting(false)
      return
    }

    try {
      const redirectTo = `${SITE_URL}/auth/callback`
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        addForm.email,
        {
          data: { name: addForm.name, role: addForm.role },
          redirectTo,
        }
      )
      if (inviteError) throw inviteError

      // Upsert the profile (the DB trigger may have already created it)
      await supabase
        .from('profiles')
        .upsert({
          id: inviteData.user.id,
          name: addForm.name,
          email: addForm.email,
          role: addForm.role,
          confirmed: false,
          invited_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      setSuccess(`Invitation sent to ${addForm.email}`)
      setAddForm({ name: '', email: '', role: 'carer' })
      setAddOpen(false)
      setTimeout(fetchUsers, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Resend Invite ──
  const handleResend = async (user) => {
    setResendingId(user.id)
    setError('')
    setSuccess('')
    try {
      if (!supabaseAdmin) throw new Error('Admin client not configured.')
      const redirectTo = `${SITE_URL}/auth/callback`
      const { error: resendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        user.email,
        { redirectTo }
      )
      if (resendError) throw resendError

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

  // ── Cancel Invite ──
  const handleCancelInvite = async (user) => {
    if (!window.confirm(`Cancel the invitation for ${user.email}?`)) return
    setError('')
    try {
      if (!supabaseAdmin) throw new Error('Admin client not configured.')
      // Remove the auth user entirely
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteAuthError) throw deleteAuthError
      // Profile will be cascade-deleted by the FK on profiles.id → auth.users.id

      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSuccess(`Invitation for ${user.email} cancelled`)
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Reset Password ──
  const handleResetPassword = async (user) => {
    setResettingId(user.id)
    setError('')
    setSuccess('')
    try {
      const redirectTo = `${SITE_URL}/auth/callback`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        user.email,
        { redirectTo }
      )
      if (resetError) throw resetError
      setSuccess(`Password reset email sent to ${user.email}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setResettingId(null)
    }
  }

  // ── Toggle Role ──
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

  // ── Toggle Active ──
  const toggleActive = async (userId, currentActive) => {
    const { error } = await supabase
      .from('profiles')
      .update({ active: !currentActive })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u))
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
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
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setError(''); setSuccess('') }}
          className="inline-flex items-center gap-2 bg-hgc-600 hover:bg-hgc-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors duration-200"
        >
          <UserPlus size={16} />
          Add Team Member
        </button>
      </div>

      {/* Banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}
      {error && !addOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* ── Add Team Member Modal ── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  id="add-name" type="text" required
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hgc-600 focus:border-transparent"
                  placeholder="e.g. Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  id="add-email" type="email" required
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hgc-600 focus:border-transparent"
                  placeholder="jane@hamiltongeorgecare.com"
                />
              </div>

              <div>
                <label htmlFor="add-role" className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  id="add-role"
                  value={addForm.role}
                  onChange={(e) => setAddForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hgc-600 focus:border-transparent"
                >
                  <option value="carer">Carer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <p className="text-xs text-gray-500">
                They'll receive an email invitation with a link to set their password.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-hgc-600 hover:bg-hgc-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {submitting ? 'Sending…' : 'Send Invite'}
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
                      <th className="text-left px-4 py-2.5 font-medium text-amber-700">Date Invited</th>
                      <th className="text-right px-4 py-2.5 font-medium text-amber-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {pendingUsers.map(u => (
                      <tr key={u.id} className="bg-white/50">
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3 text-gray-600">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatDate(u.invited_at || u.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleResend(u)}
                              disabled={resendingId === u.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {resendingId === u.id ? (
                                <span className="inline-block w-3 h-3 border-2 border-amber-400/30 border-t-amber-600 rounded-full animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              Resend Invite
                            </button>
                            <button
                              onClick={() => handleCancelInvite(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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

          {/* ── Active Users ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Active Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name || '—'}</td>
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleResetPassword(u)}
                            disabled={resettingId === u.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Send password reset email"
                          >
                            {resettingId === u.id ? (
                              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <KeyRound size={12} />
                            )}
                            Reset Password
                          </button>
                          <button
                            onClick={() => toggleRole(u.id, u.role)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title={u.role === 'admin' ? 'Change to Carer' : 'Change to Admin'}
                          >
                            {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                          </button>
                          <button
                            onClick={() => toggleActive(u.id, u.active)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Deactivate user"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                        No active team members yet. Add someone to get started.
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
