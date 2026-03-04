import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { ChevronLeft, ChevronRight, Plus, X, UserCheck } from 'lucide-react'
import { MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, formatDate } from '../utils/dates'

export default function RotaCalendar() {
  const { clients, carers, assignments, addAssignment, removeAssignment, getCarerMonthlyDays } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedClientFilter, setSelectedClientFilter] = useState('all')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const monthAssignments = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return assignments.filter(a => a.date.startsWith(prefix))
  }, [assignments, year, month])

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  function getAssignmentsForDay(day) {
    const dateStr = formatDate(year, month, day)
    let dayAssignments = monthAssignments.filter(a => a.date === dateStr)
    if (selectedClientFilter !== 'all') {
      dayAssignments = dayAssignments.filter(a => a.clientId === selectedClientFilter)
    }
    return dayAssignments
  }

  // Build calendar grid
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d)
  }

  const today = new Date()
  const isToday = (day) =>
    day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  // Carer days worked summary for sidebar
  const carerSummary = useMemo(() => {
    return carers.map(carer => {
      const days = getCarerMonthlyDays(carer.id, year, month)
      return { ...carer, daysWorked: days }
    }).sort((a, b) => b.daysWorked - a.daysWorked)
  }, [carers, year, month, getCarerMonthlyDays])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rota Calendar</h2>
          <p className="text-gray-500 text-sm mt-1">
            Assign carers to clients for each day
          </p>
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
            {/* Month header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {MONTH_NAMES[month]} {year}
                </h3>
                <button
                  onClick={goToToday}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Today
                </button>
              </div>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAY_NAMES.map(day => (
                <div key={day} className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayAssignments = day ? getAssignmentsForDay(day) : []
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
                        <div className={`text-sm font-medium mb-1 px-1 ${
                          isToday(day) ? 'text-hgc-600' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayAssignments.slice(0, 3).map(a => {
                            const client = clients.find(c => c.id === a.clientId)
                            const carer = carers.find(c => c.id === a.carerId)
                            return (
                              <div
                                key={a.id}
                                className="text-[10px] bg-hgc-100 text-hgc-800 rounded px-1 py-0.5 truncate"
                                title={`${carer?.name || 'Unknown'} → ${client?.name || 'Unknown'}`}
                              >
                                {carer?.name?.split(' ')[0]} → {client?.name?.split(' ')[0]}
                              </div>
                            )
                          })}
                          {dayAssignments.length > 3 && (
                            <div className="text-[10px] text-gray-500 px-1">
                              +{dayAssignments.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-80 space-y-4">
          {/* Assignment panel */}
          {selectedDate ? (
            <AssignmentPanel
              date={formatDate(year, month, selectedDate)}
              displayDate={`${selectedDate} ${MONTH_NAMES[month]} ${year}`}
              clients={clients}
              carers={carers}
              assignments={monthAssignments.filter(
                a => a.date === formatDate(year, month, selectedDate)
              )}
              onAdd={addAssignment}
              onRemove={removeAssignment}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">Click a day on the calendar to manage assignments</p>
            </div>
          )}

          {/* Carer days summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                Days Worked — {MONTH_NAMES[month]}
              </h4>
            </div>
            {carerSummary.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No carers registered</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {carerSummary.map(carer => (
                  <div key={carer.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-gray-700">{carer.name}</span>
                    <span className={`text-sm font-semibold ${
                      carer.daysWorked > 0 ? 'text-hgc-700' : 'text-gray-400'
                    }`}>
                      {carer.daysWorked} day{carer.daysWorked !== 1 ? 's' : ''}
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

function AssignmentPanel({ date, displayDate, clients, carers, assignments, onAdd, onRemove, onClose }) {
  const [carerId, setCarerId] = useState('')
  const [clientId, setClientId] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!carerId || !clientId) return

    // Check for duplicate
    const exists = assignments.some(
      a => a.carerId === carerId && a.clientId === clientId && a.date === date
    )
    if (exists) {
      alert('This carer is already assigned to this client on this day.')
      return
    }

    onAdd({ carerId, clientId, date })
    setCarerId('')
    setClientId('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">{displayDate}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        {clients.length === 0 || carers.length === 0 ? (
          <p className="text-sm text-gray-500">
            Add {clients.length === 0 ? 'clients' : ''}{clients.length === 0 && carers.length === 0 ? ' and ' : ''}{carers.length === 0 ? 'carers' : ''} first before creating assignments.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Carer</label>
              <select
                value={carerId}
                onChange={e => setCarerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select carer...</option>
                {carers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-hgc-600 text-white px-4 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium"
            >
              <Plus size={14} />
              Assign
            </button>
          </form>
        )}

        {/* Current assignments */}
        {assignments.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Assignments ({assignments.length})
            </h5>
            <div className="space-y-2">
              {assignments.map(a => {
                const client = clients.find(c => c.id === a.clientId)
                const carer = carers.find(c => c.id === a.carerId)
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck size={14} className="text-hgc-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {carer?.name || 'Unknown Carer'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          → {client?.name || 'Unknown Client'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(a.id)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                      title="Remove assignment"
                    >
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
