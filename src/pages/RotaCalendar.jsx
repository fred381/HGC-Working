import { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { SHIFT_TYPES } from '../data/store'
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Clock } from 'lucide-react'
import { MONTH_NAMES, getDaysInMonth, formatDate } from '../utils/dates'

// ─── Carer colour palette ────────────────────────────────────────────────────
// 10 visually distinct colours, assigned by carer index. Each carer keeps the
// same colour throughout the app regardless of sort order.

const CARER_PALETTE = [
  { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' },
  { bg: '#CFFAFE', text: '#155E75', dot: '#06B6D4' },
  { bg: '#FFEDD5', text: '#9A3412', dot: '#F97316' },
  { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1' },
  { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
]

function getCarerColour(carerIndex) {
  return CARER_PALETTE[carerIndex % CARER_PALETTE.length]
}

const SHIFT_ABBR = {
  morning: 'M',
  afternoon: 'A',
  full_day: 'FD',
  night: 'N',
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Main component ─────────────────────────────────────────────────────────

export default function RotaCalendar() {
  const { clients: allClients, carers: allCarers, shifts, addShift, updateShift, deleteShift, getCarerStats } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [modal, setModal] = useState(null) // { clientId, date, day }

  // Only show active clients as rows; keep all carers for colour mapping
  const clients = useMemo(() => allClients.filter(c => c.active !== false), [allClients])
  const carers = allCarers
  const activeCarers = useMemo(() => allCarers.filter(c => c.active !== false), [allCarers])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)

  // Build a stable carer→index map so colours stay consistent
  const carerColourMap = useMemo(() => {
    const map = {}
    carers.forEach((c, i) => { map[c.id] = i })
    return map
  }, [carers])

  // Pre-filter shifts for this month
  const monthShifts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return shifts.filter(s => s.date.startsWith(prefix))
  }, [shifts, year, month])

  // Build a lookup: clientId → date → [shift, ...]
  const shiftGrid = useMemo(() => {
    const grid = {}
    for (const s of monthShifts) {
      const key = `${s.clientId}|${s.date}`
      if (!grid[key]) grid[key] = []
      grid[key].push(s)
    }
    return grid
  }, [monthShifts])

  // Day metadata
  const days = useMemo(() => {
    const result = []
    const today = new Date()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      const dow = dateObj.getDay() // 0=Sun
      result.push({
        day: d,
        dateStr: formatDate(year, month, d),
        dow,
        dowLabel: DAY_ABBR[dow],
        isWeekend: dow === 0 || dow === 6,
        isToday: year === today.getFullYear() && month === today.getMonth() && d === today.getDate(),
      })
    }
    return result
  }, [year, month, daysInMonth])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToToday() { setCurrentDate(new Date()) }

  function openModal(clientId, dayInfo) {
    setModal({ clientId, date: dayInfo.dateStr, day: dayInfo.day })
  }

  // Carer hours summary
  const carerSummary = useMemo(() => {
    return carers.map(c => ({
      ...c,
      colourIdx: carerColourMap[c.id],
      ...getCarerStats(c.id, year, month),
    })).sort((a, b) => b.totalHours - a.totalHours)
  }, [carers, carerColourMap, year, month, getCarerStats])

  // Scroll today's column into view on mount/month change
  const scrollRef = useRef(null)
  useEffect(() => {
    if (!scrollRef.current) return
    const todayCol = scrollRef.current.querySelector('[data-today="true"]')
    if (todayCol) {
      todayCol.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [year, month])

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rota Calendar</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {clients.length} client{clients.length !== 1 ? 's' : ''} · {carers.length} carer{carers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Month/year selector */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="min-w-[170px] text-center">
            <span className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="ml-1 text-sm bg-hgc-600 text-white px-3 py-1.5 rounded-lg hover:bg-hgc-700 transition-colors font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Carer colour legend ────────────────────────────────────────────── */}
      {carers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Carers</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {carers.map((carer, idx) => {
              const colour = getCarerColour(idx)
              return (
                <div key={carer.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: colour.dot }}
                  />
                  <span className="text-sm text-gray-700">{carer.name}</span>
                  <span className="text-xs text-gray-400">({carer.role})</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Shift type key ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 px-1">
        {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
          <span key={key} className="text-xs text-gray-500">
            <span className="font-semibold text-gray-600">{SHIFT_ABBR[key]}</span> = {label} ({hours}h)
          </span>
        ))}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No clients registered. Add clients to start building rotas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${200 + daysInMonth * 80}px` }}>
              {/* ── Column headers ── */}
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Client
                  </th>
                  {days.map(d => (
                    <th
                      key={d.day}
                      data-today={d.isToday || undefined}
                      className={`border-b border-r border-gray-200 px-1 py-2 text-center min-w-[72px] ${
                        d.isToday
                          ? 'bg-hgc-600 text-white'
                          : d.isWeekend
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-tight">{d.dowLabel}</div>
                      <div className="text-sm font-bold leading-tight">{d.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Client rows ── */}
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="group">
                    {/* Sticky client name */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-b border-r border-gray-200 px-4 py-2 transition-colors">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{client.name}</div>
                      {client.clientId && (
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">{client.clientId}</div>
                      )}
                    </td>

                    {/* Day cells */}
                    {days.map(d => {
                      const key = `${client.id}|${d.dateStr}`
                      const cellShifts = shiftGrid[key] || []
                      const hasShifts = cellShifts.length > 0

                      return (
                        <td
                          key={d.day}
                          onClick={() => openModal(client.id, d)}
                          className={`border-b border-r border-gray-200 p-0.5 align-top cursor-pointer transition-colors ${
                            d.isToday
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : d.isWeekend
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {hasShifts ? (
                            <div className="space-y-0.5 p-0.5">
                              {cellShifts.map(s => {
                                const colourIdx = carerColourMap[s.carerId] ?? 0
                                const colour = getCarerColour(colourIdx)
                                const carer = carers.find(c => c.id === s.carerId)
                                const firstName = carer?.name?.split(' ')[0] || '?'
                                return (
                                  <div
                                    key={s.id}
                                    className="rounded px-1 py-0.5 text-[11px] font-medium leading-tight truncate"
                                    style={{ backgroundColor: colour.bg, color: colour.text }}
                                    title={`${carer?.name} — ${SHIFT_TYPES[s.shiftType]?.label || s.shiftType}${s.notes ? ` (${s.notes})` : ''}`}
                                  >
                                    {firstName} <span className="opacity-70">{SHIFT_ABBR[s.shiftType] || s.shiftType}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="h-full min-h-[32px] flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity">
                              <Plus size={14} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Carer hours summary ────────────────────────────────────────────── */}
      {carerSummary.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900">
              Monthly Summary — {MONTH_NAMES[month]} {year}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carer</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shifts</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {carerSummary.map(c => {
                  const colour = getCarerColour(c.colourIdx)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colour.dot }} />
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          <span className="text-xs text-gray-400">{c.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-700">{c.shiftCount}</td>
                      <td className="px-4 py-2 text-center text-sm text-gray-700">{c.daysWorked}</td>
                      <td className="px-4 py-2 text-center text-sm font-semibold text-gray-900">{c.totalHours}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modal && (
        <ShiftModal
          modal={modal}
          clients={clients}
          carers={carers}
          activeCarers={activeCarers}
          shifts={shiftGrid[`${modal.clientId}|${modal.date}`] || []}
          carerColourMap={carerColourMap}
          onAdd={addShift}
          onUpdate={updateShift}
          onDelete={deleteShift}
          onClose={() => setModal(null)}
          year={year}
          month={month}
        />
      )}
    </div>
  )
}

// ─── Shift modal ─────────────────────────────────────────────────────────────

function ShiftModal({ modal, clients, carers, activeCarers, shifts, carerColourMap, onAdd, onUpdate, onDelete, onClose, year, month }) {
  const client = clients.find(c => c.id === modal.clientId)
  const [carerId, setCarerId] = useState('')
  const [shiftType, setShiftType] = useState('full_day')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editShiftType, setEditShiftType] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleAdd(e) {
    e.preventDefault()
    if (!carerId) return

    const duplicate = shifts.some(
      s => s.carerId === carerId && s.shiftType === shiftType
    )
    if (duplicate) {
      alert('This carer already has this shift type assigned for this client on this day.')
      return
    }

    onAdd({ carerId, clientId: modal.clientId, date: modal.date, shiftType, notes })
    setCarerId('')
    setShiftType('full_day')
    setNotes('')
  }

  function startEdit(shift) {
    setEditingId(shift.id)
    setEditShiftType(shift.shiftType)
    setEditNotes(shift.notes || '')
  }

  function saveEdit() {
    if (!editingId) return
    onUpdate(editingId, { shiftType: editShiftType, notes: editNotes })
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  const displayDate = new Date(year, month, modal.day)
  const dateLabel = displayDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 rounded-t-xl flex items-start justify-between z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{client?.name || 'Unknown Client'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Existing shifts ── */}
          {shifts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Current Shifts ({shifts.length})
              </h4>
              <div className="space-y-2">
                {shifts.map(s => {
                  const carer = carers.find(c => c.id === s.carerId)
                  const colourIdx = carerColourMap[s.carerId] ?? 0
                  const colour = getCarerColour(colourIdx)
                  const isEditing = editingId === s.id

                  if (isEditing) {
                    return (
                      <div key={s.id} className="border border-hgc-300 rounded-lg p-3 bg-hgc-50 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colour.dot }} />
                          <span className="text-sm font-medium text-gray-900">{carer?.name}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
                          <select
                            value={editShiftType}
                            onChange={e => setEditShiftType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                          >
                            {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
                              <option key={key} value={key}>{label} ({hours}h)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                            placeholder="Optional notes"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="text-sm bg-hgc-600 text-white px-3 py-1 rounded-lg hover:bg-hgc-700 transition-colors font-medium">
                            Save
                          </button>
                          <button onClick={cancelEdit} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ backgroundColor: colour.bg }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colour.dot }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: colour.text }}>
                            {carer?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">
                              {SHIFT_TYPES[s.shiftType]?.label || s.shiftType} ({SHIFT_TYPES[s.shiftType]?.hours || 0}h)
                            </span>
                            {s.notes && <span className="text-xs text-gray-400">· {s.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-gray-400 hover:text-hgc-600 transition-colors p-1"
                          title="Edit shift"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove shift"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Add new shift ── */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {shifts.length > 0 ? 'Add Another Shift' : 'Assign a Carer'}
            </h4>
            {activeCarers.length === 0 ? (
              <p className="text-sm text-gray-500">Add active carers first before creating shifts.</p>
            ) : (
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Carer</label>
                  <select
                    value={carerId}
                    onChange={e => setCarerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select carer...</option>
                    {activeCarers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
                  <select
                    value={shiftType}
                    onChange={e => setShiftType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
                      <option key={key} value={key}>{label} ({hours}h)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                    placeholder="Optional notes"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} /> Assign Carer
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
