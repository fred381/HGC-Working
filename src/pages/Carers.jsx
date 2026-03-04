import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CARER_ROLES } from '../data/store'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'

const emptyForm = { name: '', employeeId: '', role: 'Carer', contactNumber: '', hourlyRate: '' }

export default function Carers() {
  const { carers, addCarer, updateCarer, deleteCarer, getCarerStats } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const filteredCarers = carers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    c.role?.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      updateCarer(editingId, form)
    } else {
      addCarer(form)
    }
    resetForm()
  }

  function handleEdit(carer) {
    setForm({
      name: carer.name,
      employeeId: carer.employeeId || '',
      role: carer.role || 'Carer',
      contactNumber: carer.contactNumber || '',
      hourlyRate: carer.hourlyRate ?? '',
    })
    setEditingId(carer.id)
    setShowForm(true)
  }

  function handleDelete(id, name) {
    if (window.confirm(`Remove ${name}? This will also remove their scheduled shifts.`)) {
      deleteCarer(id)
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carers</h2>
          <p className="text-gray-500 text-sm mt-1">{carers.length} carer{carers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-hgc-600 text-white px-4 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Carer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Carer' : 'New Carer'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. Amina Osei"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. HGC-006"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
              >
                {CARER_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. 07421 334 512"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.hourlyRate}
                onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                placeholder="e.g. 14.50"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 mt-2">
              <button
                type="submit"
                className="bg-hgc-600 text-white px-6 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium"
              >
                {editingId ? 'Update Carer' : 'Add Carer'}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {carers.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search carers..."
              className="w-full sm:w-72 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      {filteredCarers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserCheckIcon className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">
            {carers.length === 0 ? 'No carers yet. Add your first carer to get started.' : 'No carers match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rate</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">This Month</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCarers.map(carer => {
                const stats = getCarerStats(carer.id, currentYear, currentMonth)
                return (
                  <tr key={carer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {carer.employeeId || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{carer.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center text-xs font-medium bg-hgc-50 text-hgc-700 rounded-full px-2.5 py-0.5">
                        {carer.role || 'Carer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{carer.contactNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                      {carer.hourlyRate ? `£${parseFloat(carer.hourlyRate).toFixed(2)}/hr` : '—'}
                    </td>
                    <td className="px-6 py-4 text-center hidden lg:table-cell">
                      <span className="text-xs text-gray-600">
                        {stats.daysWorked}d / {stats.totalHours}h / {stats.shiftCount} shifts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(carer)} className="text-gray-400 hover:text-hgc-600 transition-colors" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(carer.id, carer.name)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UserCheckIcon(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
}
