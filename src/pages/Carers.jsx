import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'

const emptyCarer = {
  name: '',
  phone: '',
  email: '',
  employeeId: '',
  niNumber: '',
  dailyRate: '',
  travelAllowance: '',
  foodAllowance: '',
  extras: '',
  notes: '',
}

export default function Carers() {
  const { carers, addCarer, updateCarer, deleteCarer, getCarerMonthlyDays } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyCarer)
  const [search, setSearch] = useState('')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const filteredCarers = carers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
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
      phone: carer.phone || '',
      email: carer.email || '',
      employeeId: carer.employeeId || '',
      niNumber: carer.niNumber || '',
      dailyRate: carer.dailyRate || '',
      travelAllowance: carer.travelAllowance || '',
      foodAllowance: carer.foodAllowance || '',
      extras: carer.extras || '',
      notes: carer.notes || '',
    })
    setEditingId(carer.id)
    setShowForm(true)
  }

  function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to remove ${name}? This will also remove their rota assignments.`)) {
      deleteCarer(id)
    }
  }

  function resetForm() {
    setForm(emptyCarer)
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
          <Plus size={16} />
          Add Carer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Carer' : 'New Carer'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. 07700 900456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. HGC001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NI Number</label>
                <input
                  type="text"
                  value={form.niNumber}
                  onChange={e => setForm(f => ({ ...f, niNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. QQ 12 34 56 A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.dailyRate}
                  onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. 120.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Allowance / Day (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.travelAllowance}
                  onChange={e => setForm(f => ({ ...f, travelAllowance: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. 10.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Allowance / Day (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.foodAllowance}
                  onChange={e => setForm(f => ({ ...f, foodAllowance: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. 5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Extras/Bonuses (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.extras}
                  onChange={e => setForm(f => ({ ...f, extras: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  placeholder="e.g. 50.00"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="Any additional notes about this carer"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-hgc-600 text-white px-6 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium"
              >
                {editingId ? 'Update Carer' : 'Add Carer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Daily Rate</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Days This Month</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCarers.map(carer => (
                <tr key={carer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{carer.name}</span>
                    {carer.employeeId && (
                      <p className="text-xs text-gray-500 mt-0.5">ID: {carer.employeeId}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{carer.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {carer.dailyRate ? `£${parseFloat(carer.dailyRate).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center justify-center bg-hgc-50 text-hgc-700 text-sm font-medium rounded-full px-3 py-0.5">
                      {getCarerMonthlyDays(carer.id, currentYear, currentMonth)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(carer)}
                        className="text-gray-400 hover:text-hgc-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(carer.id, carer.name)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
