import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { SHIFT_TYPES } from '../data/store'
import { Download, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { MONTH_NAMES } from '../utils/dates'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCarerMonthData(carer, shifts, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const carerShifts = shifts.filter(
    s => s.carerId === carer.id && s.date.startsWith(prefix)
  )
  const uniqueDays = new Set(carerShifts.map(s => s.date))
  let totalHours = 0
  for (const s of carerShifts) {
    totalHours += SHIFT_TYPES[s.shiftType]?.hours || 0
  }
  const hourlyRate = parseFloat(carer.hourlyRate) || 0
  const basePay = totalHours * hourlyRate

  return {
    daysWorked: uniqueDays.size,
    totalHours,
    shiftCount: carerShifts.length,
    hourlyRate,
    basePay,
  }
}

function fmt(n) {
  return parseFloat(n || 0).toFixed(2)
}

function downloadCSV(rows, filename) {
  const csvContent = rows
    .map(row =>
      row.map(cell => {
        const str = String(cell ?? '')
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function Payroll() {
  const { carers, shifts } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // Editable adjustments keyed by carer ID
  const [adjustments, setAdjustments] = useState({})

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Only show active carers (but allow viewing inactive via the table)
  const activeCarers = useMemo(
    () => carers.filter(c => c.active !== false),
    [carers]
  )

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setAdjustments({})
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setAdjustments({})
  }

  // Compute rota-based data for each carer
  const payrollRows = useMemo(() => {
    return activeCarers.map(carer => {
      const data = getCarerMonthData(carer, shifts, year, month)
      return { carer, ...data }
    }).sort((a, b) => b.daysWorked - a.daysWorked || a.carer.name.localeCompare(b.carer.name))
  }, [activeCarers, shifts, year, month])

  // Get/set adjustment for a carer
  function getAdj(carerId, field) {
    return adjustments[carerId]?.[field] ?? ''
  }

  function setAdj(carerId, field, value) {
    setAdjustments(prev => ({
      ...prev,
      [carerId]: {
        ...prev[carerId],
        [field]: value,
      },
    }))
  }

  function numAdj(carerId, field) {
    return parseFloat(adjustments[carerId]?.[field]) || 0
  }

  function getRowTotal(row) {
    const id = row.carer.id
    return (
      row.basePay +
      numAdj(id, 'extras') +
      numAdj(id, 'travel') +
      numAdj(id, 'food') +
      numAdj(id, 'holiday')
    )
  }

  // Grand totals
  const totals = useMemo(() => {
    let basePay = 0, extras = 0, travel = 0, food = 0, holiday = 0, total = 0, daysWorked = 0, hours = 0
    for (const row of payrollRows) {
      const id = row.carer.id
      basePay += row.basePay
      extras += numAdj(id, 'extras')
      travel += numAdj(id, 'travel')
      food += numAdj(id, 'food')
      holiday += numAdj(id, 'holiday')
      total += getRowTotal(row)
      daysWorked += row.daysWorked
      hours += row.totalHours
    }
    return { basePay, extras, travel, food, holiday, total, daysWorked, hours }
  }, [payrollRows, adjustments])

  // CSV export
  function handleDownloadCSV() {
    const header = [
      'Employee Name',
      'Employee ID',
      'Month',
      'Days Worked',
      'Hours Worked',
      'Hourly Rate',
      'Base Pay',
      'Extras',
      'Travel Allowance',
      'Food Allowance',
      'Holiday Pay',
      'Total',
    ]

    const monthLabel = `${MONTH_NAMES[month]} ${year}`

    const dataRows = payrollRows.map(row => {
      const id = row.carer.id
      return [
        row.carer.name,
        row.carer.employeeId || '',
        monthLabel,
        row.daysWorked,
        row.totalHours,
        fmt(row.hourlyRate),
        fmt(row.basePay),
        fmt(numAdj(id, 'extras')),
        fmt(numAdj(id, 'travel')),
        fmt(numAdj(id, 'food')),
        fmt(numAdj(id, 'holiday')),
        fmt(getRowTotal(row)),
      ]
    })

    const filename = `HGC_Payroll_${MONTH_NAMES[month]}_${year}.csv`
    downloadCSV([header, ...dataRows], filename)
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and export monthly payroll for all carers
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={payrollRows.length === 0}
          className="flex items-center gap-2 bg-hgc-600 text-white px-4 py-2.5 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Download Payroll Sheet
        </button>
      </div>

      {/* ── Month selector ── */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div className="min-w-[170px] text-center">
          <span className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* ── Payroll table ── */}
      {activeCarers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No active carers. Add carers to generate payroll.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '960px' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                    Carer
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Days
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Hours
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                    Base Pay
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <span className="block">Extras /</span>
                    <span className="block">Bonus (£)</span>
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <span className="block">Travel</span>
                    <span className="block">Allow. (£)</span>
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <span className="block">Food</span>
                    <span className="block">Allow. (£)</span>
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <span className="block">Holiday</span>
                    <span className="block">Pay (£)</span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payrollRows.map(row => {
                  const id = row.carer.id
                  const rowTotal = getRowTotal(row)
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      {/* Carer */}
                      <td className="px-4 py-3 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-hgc-100 text-hgc-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {row.carer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{row.carer.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{row.carer.employeeId || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Days worked (auto) */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-semibold ${row.daysWorked > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                          {row.daysWorked}
                        </span>
                      </td>

                      {/* Hours (auto) */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm text-gray-600">{row.totalHours}h</span>
                      </td>

                      {/* Base pay (auto) */}
                      <td className="px-3 py-3 text-right">
                        <div>
                          <span className="text-sm font-medium text-gray-900">£{fmt(row.basePay)}</span>
                          {row.hourlyRate > 0 && (
                            <p className="text-[10px] text-gray-400">{row.totalHours}h × £{fmt(row.hourlyRate)}</p>
                          )}
                        </div>
                      </td>

                      {/* Extras / Bonus */}
                      <td className="px-2 py-3">
                        <CurrencyInput
                          value={getAdj(id, 'extras')}
                          onChange={v => setAdj(id, 'extras', v)}
                        />
                      </td>

                      {/* Travel Allowance */}
                      <td className="px-2 py-3">
                        <CurrencyInput
                          value={getAdj(id, 'travel')}
                          onChange={v => setAdj(id, 'travel', v)}
                        />
                      </td>

                      {/* Food Allowance */}
                      <td className="px-2 py-3">
                        <CurrencyInput
                          value={getAdj(id, 'food')}
                          onChange={v => setAdj(id, 'food', v)}
                        />
                      </td>

                      {/* Holiday Pay */}
                      <td className="px-2 py-3">
                        <CurrencyInput
                          value={getAdj(id, 'holiday')}
                          onChange={v => setAdj(id, 'holiday', v)}
                        />
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${rowTotal > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                          £{fmt(rowTotal)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* ── Totals row ── */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10">
                    <span className="text-sm font-bold text-gray-900">Totals</span>
                    <span className="text-xs text-gray-400 ml-2">({payrollRows.length} carer{payrollRows.length !== 1 ? 's' : ''})</span>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">{totals.daysWorked}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">{totals.hours}h</td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">£{fmt(totals.basePay)}</td>
                  <td className="px-2 py-3 text-center text-sm font-bold text-gray-900">£{fmt(totals.extras)}</td>
                  <td className="px-2 py-3 text-center text-sm font-bold text-gray-900">£{fmt(totals.travel)}</td>
                  <td className="px-2 py-3 text-center text-sm font-bold text-gray-900">£{fmt(totals.food)}</td>
                  <td className="px-2 py-3 text-center text-sm font-bold text-gray-900">£{fmt(totals.holiday)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-base font-bold text-gray-900">£{fmt(totals.total)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Info note ── */}
      <p className="text-xs text-gray-400 mt-3 px-1">
        Days worked and base pay are calculated automatically from the rota.
        Enter any extras, allowances, or holiday pay manually per carer.
        The CSV export includes all values shown in the table.
      </p>
    </div>
  )
}

// ─── Currency input ──────────────────────────────────────────────────────────

function CurrencyInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">£</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0.00"
        className="w-full pl-6 pr-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-hgc-500 focus:border-transparent outline-none placeholder:text-gray-300"
      />
    </div>
  )
}
