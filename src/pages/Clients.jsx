import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Pencil, X, Search, MapPin, Users, UserX, UserCheck } from 'lucide-react'

const emptyForm = { name: '', clientId: '', careNeeds: '', address: '' }

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [expandedId, setExpandedId] = useState(null)

  const filteredClients = clients
    .filter(c => {
      const isActive = c.active !== false
      if (statusFilter === 'active') return isActive
      if (statusFilter === 'inactive') return !isActive
      return true
    })
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.careNeeds?.toLowerCase().includes(search.toLowerCase())
    )

  const activeCount = clients.filter(c => c.active !== false).length
  const inactiveCount = clients.length - activeCount

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(client) {
    setForm({
      name: client.name,
      clientId: client.clientId || '',
      careNeeds: client.careNeeds || '',
      address: client.address || '',
    })
    setEditingId(client.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      updateClient(editingId, form)
    } else {
      addClient(form)
    }
    closeModal()
  }

  function toggleActive(client) {
    const isActive = client.active !== false
    if (window.confirm(`${isActive ? 'Mark' : 'Reactivate'} ${client.name} as ${isActive ? 'inactive' : 'active'}?${isActive ? ' They will no longer appear on the rota grid.' : ''}`)) {
      updateClient(client.id, { active: !isActive })
    }
  }

  function handleDelete(client) {
    if (window.confirm(`Permanently remove ${client.name} and all their scheduled shifts? This cannot be undone.\n\nConsider marking as inactive instead.`)) {
      deleteClient(client.id)
    }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, address, or care needs..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none bg-white"
          />
        </div>
        <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden">
          {[
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
            { key: 'all', label: 'All' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === key
                  ? 'bg-hgc-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Client cards ── */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {clients.length === 0
              ? 'No clients registered yet. Add your first client to get started.'
              : 'No clients match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Address</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Care Needs</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map(client => {
                  const isActive = client.active !== false
                  const isExpanded = expandedId === client.id
                  return (
                    <tr
                      key={client.id}
                      className={`transition-colors ${isActive ? 'hover:bg-gray-50' : 'bg-gray-50/50'}`}
                    >
                      {/* Name + Client ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            isActive ? 'bg-hgc-100 text-hgc-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                              {client.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{client.clientId || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        {client.address ? (
                          <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs">
                            <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      {/* Care Needs */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {client.careNeeds ? (
                          <p className="text-sm text-gray-600 max-w-sm line-clamp-2">{client.careNeeds}</p>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
                          isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(client)}
                            className="p-1.5 text-gray-400 hover:text-hgc-600 hover:bg-hgc-50 rounded-lg transition-colors"
                            title="Edit client"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleActive(client)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={isActive ? 'Mark as inactive' : 'Reactivate client'}
                          >
                            {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <ClientModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onDelete={editingId ? () => { handleDelete(clients.find(c => c.id === editingId)); closeModal() } : null}
        />
      )}
    </div>
  )
}

// ─── Client add/edit modal ───────────────────────────────────────────────────

function ClientModal({ form, setForm, editingId, onSubmit, onClose, onDelete }) {
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Client' : 'Add New Client'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. Margaret Thompson"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. CLT-005"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="Full address including postcode"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Care Needs</label>
              <textarea
                value={form.careNeeds}
                onChange={e => setForm(f => ({ ...f, careNeeds: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Brief summary of care requirements, conditions, and preferences"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Delete permanently
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-medium text-white bg-hgc-600 rounded-lg hover:bg-hgc-700 transition-colors shadow-sm"
              >
                {editingId ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
