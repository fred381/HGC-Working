import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { CARER_ROLES } from '../data/store'
import { Plus, Pencil, X, Search, Phone, UserCheck, UserX } from 'lucide-react'

const emptyForm = { name: '', employeeId: '', role: 'Carer', contactNumber: '', hourlyRate: '' }

export default function Carers() {
  const { carers, addCarer, updateCarer, deleteCarer, getCarerStats } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const filteredCarers = carers
    .filter(c => {
      const isActive = c.active !== false
      if (statusFilter === 'active') return isActive
      if (statusFilter === 'inactive') return !isActive
      return true
    })
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase())
    )

  const activeCount = carers.filter(c => c.active !== false).length
  const inactiveCount = carers.length - activeCount

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(carer) {
    setForm({
      name: carer.name,
      employeeId: carer.employeeId || '',
      role: carer.role || 'Carer',
      contactNumber: carer.contactNumber || '',
      hourlyRate: carer.hourlyRate ?? '',
    })
    setEditingId(carer.id)
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
      updateCarer(editingId, form)
    } else {
      addCarer(form)
    }
    closeModal()
  }

  function toggleActive(carer) {
    const isActive = carer.active !== false
    if (window.confirm(`${isActive ? 'Deactivate' : 'Reactivate'} ${carer.name}?${isActive ? ' They will no longer appear in scheduling dropdowns.' : ''}`)) {
      updateCarer(carer.id, { active: !isActive })
    }
  }

  function handleDelete(carer) {
    if (window.confirm(`Permanently remove ${carer.name} and all their shifts? This cannot be undone.\n\nConsider deactivating instead.`)) {
      deleteCarer(carer.id)
    }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hgc-900">Carers</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
        >
          <Plus size={16} /> Add Carer
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
            placeholder="Search by name, ID, or role..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none bg-white transition-shadow duration-200"
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
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                statusFilter === key
                  ? 'bg-hgc-600 text-white shadow-inner'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {filteredCarers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-hgc-50 flex items-center justify-center mx-auto mb-4">
            <UserCheck size={28} className="text-hgc-400" />
          </div>
          {carers.length === 0 ? (
            <>
              <h3 className="text-base font-semibold text-hgc-900 mb-1">No carers added yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                Get started by adding your first carer. They will appear here and be available for rota assignments.
              </p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
              >
                <Plus size={16} /> Add Carer
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-hgc-900 mb-1">No carers match your filters</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or status filter.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Carer</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Rate</th>
                  <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">This Month</th>
                  <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCarers.map(carer => {
                  const isActive = carer.active !== false
                  const stats = getCarerStats(carer.id, currentYear, currentMonth)
                  return (
                    <tr key={carer.id} className={`transition-colors duration-150 ${isActive ? 'hover:bg-gray-50/60' : 'bg-gray-50/30'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors duration-200 ${
                            isActive ? 'bg-hgc-100 text-hgc-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {carer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-hgc-900' : 'text-gray-500'}`}>
                              {carer.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{carer.employeeId || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${
                          isActive ? 'bg-hgc-50 text-hgc-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {carer.role || 'Carer'}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {carer.contactNumber ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone size={13} className="text-gray-400 flex-shrink-0" />
                            {carer.contactNumber}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm font-medium text-gray-700">
                          {carer.hourlyRate ? `£${parseFloat(carer.hourlyRate).toFixed(2)}` : '—'}
                        </span>
                        {carer.hourlyRate > 0 && <span className="text-xs text-gray-400">/hr</span>}
                      </td>
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        {stats.shiftCount > 0 ? (
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-hgc-900">{stats.totalHours}h</span>
                            <span className="text-gray-300 mx-1">·</span>
                            {stats.shiftCount} shift{stats.shiftCount !== 1 ? 's' : ''}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No shifts</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(carer)}
                            className="p-1.5 text-gray-400 hover:text-hgc-600 hover:bg-hgc-50 rounded-lg transition-all duration-200"
                            title="Edit carer"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleActive(carer)}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate carer' : 'Reactivate carer'}
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
        <CarerModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onDelete={editingId ? () => { handleDelete(carers.find(c => c.id === editingId)); closeModal() } : null}
        />
      )}
    </div>
  )
}

// ─── Carer add/edit modal ────────────────────────────────────────────────────

function CarerModal({ form, setForm, editingId, onSubmit, onClose, onDelete }) {
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-hgc-950/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-hgc-900">
            {editingId ? 'Edit Carer' : 'Add New Carer'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input ref={nameRef} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200" placeholder="e.g. Amina Osei" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input type="text" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200" placeholder="e.g. HGC-006" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200">
                {CARER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input type="tel" value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200" placeholder="e.g. 07421 334 512" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Rate (£/hr)</label>
              <input type="number" step="0.01" min="0" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200" placeholder="e.g. 14.50" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {onDelete && (
                <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-colors duration-200">
                  Delete permanently
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-hgc-600 rounded-lg hover:bg-hgc-700 transition-all duration-200 shadow-sm hover:shadow">
                {editingId ? 'Save Changes' : 'Add Carer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
