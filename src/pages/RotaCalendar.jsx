import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SHIFT_TYPES } from '../data/store'
import { ChevronLeft, ChevronRight, Plus, X, UserCheck, Clock } from 'lucide-react'
import { MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, formatDate } from '../utils/dates'

const SHIFT_COLOURS = {
  morning:   'bg-amber-100 text-amber-800',
  afternoon: 'bg-sky-100 text-sky-800',
  full_day:  'bg-emerald-100 text-emerald-800',
  night:     'bg-indigo-100 text-indigo-800',
}

export default function RotaCalendar() {
  const { clients, carers, shifts, addShift, deleteShift, getCarerStats } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedClientFilter, setSelectedClientFilter] = useState('all')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const monthShifts = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return shifts.filter(s => s.date.startsWith(prefix))
  }, [shifts, year, month])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null) }
  function goToToday() { setCurrentDate(new Date()); setSelectedDate(null) }

  function getShiftsForDay(day) {
    const dateStr = formatDate(year, month, day)
    let dayShifts = monthShifts.filter(s => s.date === dateStr)
    if (selectedClientFilter !== 'all') {
      dayShifts = dayShifts.filter(s => s.clientId === selectedClientFilter)
    }
    return dayShifts
  }

  // Build calendar grid
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  const today = new Date()
  const isToday = (day) =>
    day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  // Carer summary sidebar
  const carerSummary = useMemo(() => {
    return carers.map(carer => ({
      ...carer,
      ...getCarerStats(carer.id, year, month),
    })).sort((a, b) => b.totalHours - a.totalHours)
  }, [carers, year, month, getCarerStats])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rota Calendar</h2>
          <p className="text-gray-500 text-sm mt-1">Schedule shifts for carers and clients</p>
        </div>
        {clients.length > 1 && (
          <select
            value={selectedClientFilter}
            onChange={e => setSelectedClientFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
          >
            <option value="all">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h3>
                <button onClick={goToToday} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors">Today</button>
              </div>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAY_NAMES.map(day => (
                <div key={day} className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayShifts = day ? getShiftsForDay(day) : []
                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] border-b border-r border-gray-100 p-1 ${
                      day ? 'cursor-pointer hover:bg-hgc-50 transition-colors' : 'bg-gray-50'
                    } ${isToday(day) ? 'bg-blue-50' : ''} ${
                      selectedDate === day ? 'ring-2 ring-inset ring-hgc-500' : ''
                    }`}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 px-1 ${isToday(day) ? 'text-hgc-600' : 'text-gray-700'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayShifts.slice(0, 3).map(s => {
                            const carer = carers.find(c => c.id === s.carerId)
                            const shiftInfo = SHIFT_TYPES[s.shiftType] || SHIFT_TYPES.full_day
                            const colourClass = SHIFT_COLOURS[s.shiftType] || SHIFT_COLOURS.full_day
                            return (
                              <div
                                key={s.id}
                                className={`text-[10px] rounded px-1 py-0.5 truncate ${colourClass}`}
                                title={`${carer?.name || '?'} — ${shiftInfo.label} (${shiftInfo.hours}h)`}
                              >
                                {carer?.name?.split(' ')[0]} · {shiftInfo.label}
                              </div>
                            )
                          })}
                          {dayShifts.length > 3 && (
                            <div className="text-[10px] text-gray-500 px-1">+{dayShifts.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shift type legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(SHIFT_TYPES).map(([key, { label, hours }]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded ${SHIFT_COLOURS[key]?.split(' ')[0]}`} />
                <span className="text-xs text-gray-600">{label} ({hours}h)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-80 space-y-4">
          {selectedDate ? (
            <ShiftPanel
              date={formatDate(year, month, selectedDate)}
              displayDate={`${selectedDate} ${MONTH_NAMES[month]} ${year}`}
              clients={clients}
              carers={carers}
              shifts={monthShifts.filter(s => s.date === formatDate(year, month, selectedDate))}
              onAdd={addShift}
              onRemove={deleteShift}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">Click a day on the calendar to manage shifts</p>
            </div>
          )}

          {/* Carer hours summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Carer Hours — {MONTH_NAMES[month]}</h4>
            </div>
            {carerSummary.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No carers registered</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {carerSummary.map(carer => (
                  <div key={carer.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <span className="text-sm text-gray-700">{carer.name}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{carer.role}</span>
                    </div>
                    <span className={`text-sm font-semibold ${carer.totalHours > 0 ? 'text-hgc-700' : 'text-gray-400'}`}>
                      {carer.totalHours}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShiftPanel({ date, displayDate, clients, carers, shifts, onAdd, onRemove, onClose }) {
  const [carerId, setCarerId] = useState('')
  const [clientId, setClientId] = useState('')
  const [shiftType, setShiftType] = useState('full_day')
  const [notes, setNotes] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!carerId || !clientId) return

    const duplicate = shifts.some(
      s => s.carerId === carerId && s.clientId === clientId && s.shiftType === shiftType
    )
    if (duplicate) {
      alert('This carer already has this shift type for this client on this day.')
      return
    }

    onAdd({ carerId, clientId, date, shiftType, notes })
    setCarerId('')
    setClientId('')
    setShiftType('full_day')
    setNotes('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">{displayDate}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <div className="p-4">
        {clients.length === 0 || carers.length === 0 ? (
          <p className="text-sm text-gray-500">
            Add {clients.length === 0 ? 'clients' : ''}{clients.length === 0 && carers.length === 0 ? ' and ' : ''}{carers.length === 0 ? 'carers' : ''} first.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Carer</label>
              <select value={carerId} onChange={e => setCarerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none" required>
                <option value="">Select carer...</option>
                {carers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none" required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none">
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
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-hgc-600 text-white px-4 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium">
              <Plus size={14} /> Add Shift
            </button>
          </form>
        )}

        {shifts.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Shifts ({shifts.length})
            </h5>
            <div className="space-y-2">
              {shifts.map(s => {
                const client = clients.find(c => c.id === s.clientId)
                const carer = carers.find(c => c.id === s.carerId)
                const shiftInfo = SHIFT_TYPES[s.shiftType] || SHIFT_TYPES.full_day
                const colourClass = SHIFT_COLOURS[s.shiftType] || SHIFT_COLOURS.full_day
                return (
                  <div key={s.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <UserCheck size={14} className="text-hgc-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{carer?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">→ {client?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${colourClass}`}>
                            {shiftInfo.label} ({shiftInfo.hours}h)
                          </span>
                          {s.notes && <span className="text-[10px] text-gray-400 truncate">{s.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onRemove(s.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2 mt-0.5" title="Remove shift">
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
