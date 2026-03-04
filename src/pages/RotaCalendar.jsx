import { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { SHIFT_TYPES } from '../data/store'
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Clock, CalendarDays, Users, AlertTriangle, Filter } from 'lucide-react'
import { MONTH_NAMES, getDaysInMonth, formatDate } from '../utils/dates'

// ─── Carer colour palette ────────────────────────────────────────────────────

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
  const { clients: allClients, carers: allCarers, shifts, addShift, addShiftsBatch, updateShift, deleteShift, getCarerStats } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [modal, setModal] = useState(null)
  const [filterClientId, setFilterClientId] = useState('')
  const [filterCarerId, setFilterCarerId] = useState('')

  const clients = useMemo(() => allClients.filter(c => c.active !== false), [allClients])
  const carers = allCarers
  const activeCarers = useMemo(() => allCarers.filter(c => c.active !== false), [allCarers])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)

  const carerColourMap = useMemo(() => {
    const map = {}
    carers.forEach((c, i) => { map[c.id] = i })
    return map
  }, [carers])

  const monthShifts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return shifts.filter(s => s.date.startsWith(prefix))
  }, [shifts, year, month])

  const shiftGrid = useMemo(() => {
    const grid = {}
    for (const s of monthShifts) {
      const key = `${s.clientId}|${s.date}`
      if (!grid[key]) grid[key] = []
      grid[key].push(s)
    }
    return grid
  }, [monthShifts])

  const days = useMemo(() => {
    const result = []
    const today = new Date()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      const dow = dateObj.getDay()
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

  // ── Summary stats ──
  const summaryStats = useMemo(() => {
    const totalShifts = monthShifts.length
    const uniqueCarerIds = new Set(monthShifts.map(s => s.carerId))
    const carersWorking = uniqueCarerIds.size

    // Days with no cover: weekdays where no client has any shift
    // (only meaningful when there are clients to cover)
    const daysNoCover = []
    if (clients.length > 0) {
      for (const d of days) {
        if (d.isWeekend) continue
        const hasAnyShift = clients.some(client => {
          const key = `${client.id}|${d.dateStr}`
          return shiftGrid[key] && shiftGrid[key].length > 0
        })
        if (!hasAnyShift) daysNoCover.push(d.day)
      }
    }

    return { totalShifts, carersWorking, daysNoCover }
  }, [monthShifts, days, clients, shiftGrid])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToToday() { setCurrentDate(new Date()) }

  function openModal(clientId, dayInfo) {
    setModal({ clientId, date: dayInfo.dateStr, day: dayInfo.day })
  }

  const carerSummary = useMemo(() => {
    return carers.map(c => ({
      ...c,
      colourIdx: carerColourMap[c.id],
      ...getCarerStats(c.id, year, month),
    })).sort((a, b) => b.totalHours - a.totalHours)
  }, [carers, carerColourMap, year, month, getCarerStats])

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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-hgc-900">Rota Calendar</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {clients.length} client{clients.length !== 1 ? 's' : ''} · {activeCarers.length} active carer{activeCarers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="min-w-[170px] text-center">
            <span className="text-lg font-semibold text-hgc-900">{MONTH_NAMES[month]} {year}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm">
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="ml-1 text-sm bg-hgc-600 text-white px-3.5 py-2 rounded-lg hover:bg-hgc-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Summary stats bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-hgc-50 flex items-center justify-center flex-shrink-0">
            <CalendarDays size={20} className="text-hgc-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-hgc-900 leading-tight">{summaryStats.totalShifts}</p>
            <p className="text-xs text-gray-500 font-medium">Total Shifts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-hgc-900 leading-tight">{summaryStats.carersWorking}</p>
            <p className="text-xs text-gray-500 font-medium">Carers Working</p>
          </div>
        </div>
        <div className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 shadow-sm ${
          summaryStats.daysNoCover.length > 0 ? 'border-amber-200' : 'border-gray-200'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            summaryStats.daysNoCover.length > 0 ? 'bg-amber-50' : 'bg-gray-50'
          }`}>
            <AlertTriangle size={20} className={summaryStats.daysNoCover.length > 0 ? 'text-amber-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className={`text-2xl font-bold leading-tight ${
              summaryStats.daysNoCover.length > 0 ? 'text-amber-600' : 'text-hgc-900'
            }`}>
              {summaryStats.daysNoCover.length}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {summaryStats.daysNoCover.length === 0
                ? 'All Weekdays Covered'
                : `Day${summaryStats.daysNoCover.length !== 1 ? 's' : ''} Without Cover`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Carer colour legend ── */}
      {carers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Carer Legend</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {carers.map((carer, idx) => {
              const colour = getCarerColour(idx)
              return (
                <div key={carer.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: colour.dot }}
                  />
                  <span className="text-sm text-gray-700">{carer.name}</span>
                  <span className="text-xs text-gray-400">({carer.role})</span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-100">
            {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
              <span key={key} className="text-[11px] text-gray-400">
                <span className="font-semibold text-gray-500">{SHIFT_ABBR[key]}</span> = {label} ({hours}h)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      {clients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Filter size={15} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <select
              value={filterClientId}
              onChange={e => setFilterClientId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200 min-w-[170px]"
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterCarerId}
              onChange={e => setFilterCarerId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200 min-w-[170px]"
            >
              <option value="">All Carers</option>
              {carers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
              ))}
            </select>
            {(filterClientId || filterCarerId) && (
              <button
                onClick={() => { setFilterClientId(''); setFilterCarerId('') }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-hgc-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all duration-200 font-medium"
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-hgc-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={28} className="text-hgc-400" />
          </div>
          <h3 className="text-base font-semibold text-hgc-900 mb-1">No clients registered</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add clients on the Clients page to start building your rota. Each client will appear as a row in the calendar grid.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: `${200 + daysInMonth * 80}px` }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider min-w-[180px]">
                    Client
                  </th>
                  {days.map(d => (
                    <th
                      key={d.day}
                      data-today={d.isToday || undefined}
                      className={`border-b border-r border-gray-200 px-1 py-2 text-center min-w-[72px] transition-colors ${
                        d.isToday
                          ? 'bg-hgc-600 text-white'
                          : d.isWeekend
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-tight">{d.dowLabel}</div>
                      <div className="text-sm font-bold leading-tight">{d.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {clients.filter(c => {
                  if (filterClientId && c.id !== filterClientId) return false
                  if (filterCarerId && !monthShifts.some(s => s.clientId === c.id && s.carerId === filterCarerId)) return false
                  return true
                }).map(client => (
                  <tr key={client.id} className="group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/80 border-b border-r border-gray-200 px-4 py-2.5 transition-colors duration-150">
                      <div className="text-sm font-medium text-hgc-900 truncate max-w-[160px]">{client.name}</div>
                      {client.clientId && (
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">{client.clientId}</div>
                      )}
                    </td>

                    {days.map(d => {
                      const key = `${client.id}|${d.dateStr}`
                      const allCellShifts = shiftGrid[key] || []
                      const cellShifts = filterCarerId
                        ? allCellShifts.filter(s => s.carerId === filterCarerId)
                        : allCellShifts
                      const hasShifts = cellShifts.length > 0

                      return (
                        <td
                          key={d.day}
                          onClick={() => openModal(client.id, d)}
                          className={`border-b border-r border-gray-200 p-0.5 align-top cursor-pointer transition-colors duration-150 ${
                            d.isToday
                              ? 'bg-blue-50/60 hover:bg-blue-100/60'
                              : d.isWeekend
                                ? 'bg-gray-50/60 hover:bg-gray-100/60'
                                : 'bg-white hover:bg-gray-50/60'
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
                                    {firstName} <span className="opacity-60">{SHIFT_ABBR[s.shiftType] || s.shiftType}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="h-full min-h-[32px] flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity duration-200">
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

      {/* ── Carer hours summary ── */}
      {carerSummary.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-hgc-900">
              Monthly Summary — {MONTH_NAMES[month]} {year}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Carer</th>
                  <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Shifts</th>
                  <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Days</th>
                  <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {carerSummary.map(c => {
                  const colour = getCarerColour(c.colourIdx)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded flex-shrink-0" style={{ backgroundColor: colour.dot }} />
                          <span className="text-sm font-medium text-hgc-900">{c.name}</span>
                          <span className="text-xs text-gray-400">{c.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{c.shiftCount}</td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{c.daysWorked}</td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-hgc-900">{c.totalHours}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <ShiftModal
          modal={modal}
          clients={clients}
          carers={carers}
          activeCarers={activeCarers}
          shifts={shiftGrid[`${modal.clientId}|${modal.date}`] || []}
          allShifts={shifts}
          carerColourMap={carerColourMap}
          onAdd={addShift}
          onAddBatch={addShiftsBatch}
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateDateRange(startStr, endStr) {
  const dates = []
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  const cur = new Date(start)
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ─── Shift modal ─────────────────────────────────────────────────────────────

function ShiftModal({ modal, clients, carers, activeCarers, shifts, allShifts, carerColourMap, onAdd, onAddBatch, onUpdate, onDelete, onClose, year, month }) {
  const client = clients.find(c => c.id === modal.clientId)
  const [carerId, setCarerId] = useState('')
  const [shiftType, setShiftType] = useState('full_day')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState(modal.date)
  const [endDate, setEndDate] = useState(modal.date)
  const [lastResult, setLastResult] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editShiftType, setEditShiftType] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const isMultiDay = startDate !== endDate && endDate > startDate
  const dayCount = isMultiDay
    ? Math.round((new Date(endDate + 'T00:00:00') - new Date(startDate + 'T00:00:00')) / 86400000) + 1
    : 1

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleAdd(e) {
    e.preventDefault()
    if (!carerId) return

    if (isMultiDay) {
      const dates = generateDateRange(startDate, endDate)
      const clientId = modal.clientId
      const newShifts = dates.filter(date => {
        return !allShifts.some(
          s => s.carerId === carerId && s.clientId === clientId && s.date === date && s.shiftType === shiftType
        )
      }).map(date => ({ carerId, clientId, date, shiftType, notes }))

      if (newShifts.length === 0) {
        alert('This carer already has this shift type assigned for this client on all selected days.')
        return
      }

      onAddBatch(newShifts)
      const skipped = dates.length - newShifts.length
      setLastResult({ created: newShifts.length, skipped, total: dates.length })
      setCarerId('')
      setShiftType('full_day')
      setNotes('')
      setStartDate(modal.date)
      setEndDate(modal.date)
    } else {
      const duplicate = shifts.some(s => s.carerId === carerId && s.shiftType === shiftType)
      if (duplicate) {
        alert('This carer already has this shift type assigned for this client on this day.')
        return
      }
      onAdd({ carerId, clientId: modal.clientId, date: startDate, shiftType, notes })
      setLastResult(null)
      setCarerId('')
      setShiftType('full_day')
      setNotes('')
    }
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

  function cancelEdit() { setEditingId(null) }

  const displayDate = new Date(year, month, modal.day)
  const dateLabel = displayDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-hgc-950/40 backdrop-blur-[2px]" />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 rounded-t-xl flex items-start justify-between z-10">
          <div>
            <h3 className="text-base font-semibold text-hgc-900">{client?.name || 'Unknown Client'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Existing shifts for this day */}
          {shifts.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                      <div key={s.id} className="border border-hgc-300 rounded-xl p-3 bg-hgc-50 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: colour.dot }} />
                          <span className="text-sm font-medium text-hgc-900">{carer?.name}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
                          <select
                            value={editShiftType}
                            onChange={e => setEditShiftType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
                            placeholder="Optional notes"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="text-sm bg-hgc-600 text-white px-3 py-1.5 rounded-lg hover:bg-hgc-700 transition-all duration-200 font-medium shadow-sm">
                            Save
                          </button>
                          <button onClick={cancelEdit} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all duration-200">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:shadow-sm"
                      style={{ backgroundColor: colour.bg }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: colour.dot }} />
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
                          className="text-gray-400 hover:text-hgc-600 transition-colors duration-200 p-1"
                          title="Edit shift"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
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

          {/* Add new shift */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {shifts.length > 0 ? 'Add Another Shift' : 'Assign a Carer'}
            </h4>
            {activeCarers.length === 0 ? (
              <p className="text-sm text-gray-500">Add active carers on the Carers page before creating shifts.</p>
            ) : (
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Carer</label>
                  <select
                    value={carerId}
                    onChange={e => setCarerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
                  >
                    {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
                      <option key={key} value={key}>{label} ({hours}h)</option>
                    ))}
                  </select>
                </div>

                {/* Date range for multi-day scheduling */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => {
                        setStartDate(e.target.value)
                        if (e.target.value > endDate) setEndDate(e.target.value)
                        setLastResult(null)
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={e => { setEndDate(e.target.value); setLastResult(null) }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
                      required
                    />
                  </div>
                </div>
                {isMultiDay && (
                  <p className="text-xs text-hgc-600 font-medium">
                    {dayCount} days selected — a {SHIFT_TYPES[shiftType]?.label || shiftType} shift will be created for each day.
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-hgc-600 focus:border-transparent outline-none transition-shadow duration-200"
                    placeholder="Optional notes"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
                >
                  <Plus size={16} />
                  {isMultiDay ? `Assign for ${dayCount} Days` : 'Assign Carer'}
                </button>
              </form>
            )}

            {lastResult && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
                Created {lastResult.created} shift{lastResult.created !== 1 ? 's' : ''}.
                {lastResult.skipped > 0 && (
                  <span className="text-amber-700"> {lastResult.skipped} day{lastResult.skipped !== 1 ? 's' : ''} skipped (already assigned).</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
