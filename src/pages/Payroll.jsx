import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SHIFT_TYPES } from '../data/store'
import { Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTH_NAMES } from '../utils/dates'
import { generatePayrollData, exportPayrollToExcel, exportPayrollToCSV } from '../utils/payroll'

export default function Payroll() {
  const { carers, shifts } = useApp()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedCarerId, setSelectedCarerId] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  const payrollSummaries = useMemo(() => {
    return carers.map(carer => {
      const data = generatePayrollData(carer, shifts, year, month)
      return { carer, ...data }
    }).sort((a, b) => b.totalHours - a.totalHours)
  }, [carers, shifts, year, month])

  const selectedPayroll = useMemo(() => {
    if (!selectedCarerId) return null
    const carer = carers.find(c => c.id === selectedCarerId)
    if (!carer) return null
    return { carer, data: generatePayrollData(carer, shifts, year, month) }
  }, [selectedCarerId, carers, shifts, year, month])

  function handleExportExcel(carer) {
    const data = generatePayrollData(carer, shifts, year, month)
    exportPayrollToExcel(data, carer)
  }

  function handleExportCSV(carer) {
    const data = generatePayrollData(carer, shifts, year, month)
    exportPayrollToCSV(data, carer)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll</h2>
          <p className="text-gray-500 text-sm mt-1">Generate and download payroll sheets per carer</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {carers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">No carers registered. Add carers first to generate payroll.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Payroll table */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carer</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shifts</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Hours</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Gross</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrollSummaries.map(({ carer, shiftCount, totalHours, grossPay, totalPay }) => (
                    <tr
                      key={carer.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedCarerId === carer.id ? 'bg-hgc-50' : ''
                      }`}
                      onClick={() => setSelectedCarerId(carer.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{carer.name}</span>
                        <p className="text-xs text-gray-500">{carer.role} · £{parseFloat(carer.hourlyRate || 0).toFixed(2)}/hr</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center text-sm font-semibold rounded-full px-2.5 py-0.5 ${
                          shiftCount > 0 ? 'bg-hgc-50 text-hgc-700' : 'bg-gray-100 text-gray-400'
                        }`}>{shiftCount}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600 hidden sm:table-cell">{totalHours}h</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-600 hidden md:table-cell">£{grossPay.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">£{totalPay.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleExportExcel(carer)} className="text-gray-400 hover:text-green-600 transition-colors p-1" title="Download Excel">
                            <FileSpreadsheet size={16} />
                          </button>
                          <button onClick={() => handleExportCSV(carer)} className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Download CSV">
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedPayroll && (
            <div className="lg:w-80">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedPayroll.carer.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedPayroll.data.role} · {selectedPayroll.data.month} {selectedPayroll.data.year}
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Shift breakdown */}
                  {Object.keys(selectedPayroll.data.shiftBreakdown).length > 0 && (
                    <>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift Breakdown</h5>
                      {Object.entries(selectedPayroll.data.shiftBreakdown).map(([key, info]) => (
                        <PayrollRow key={key} label={`${info.label} (${info.count}x)`} value={`${info.totalHours}h`} />
                      ))}
                      <hr className="border-gray-200" />
                    </>
                  )}
                  <PayrollRow label="Total Shifts" value={selectedPayroll.data.shiftCount} />
                  <PayrollRow label="Days Worked" value={selectedPayroll.data.daysWorked} />
                  <PayrollRow label="Total Hours" value={`${selectedPayroll.data.totalHours}h`} bold />
                  <PayrollRow label="Hourly Rate" value={`£${selectedPayroll.data.hourlyRate.toFixed(2)}`} />
                  <hr className="border-gray-200" />
                  <PayrollRow label="Gross Pay" value={`£${selectedPayroll.data.grossPay.toFixed(2)}`} bold />
                  <PayrollRow label="Holiday Pay (12.07%)" value={`£${selectedPayroll.data.holidayPay.toFixed(2)}`} />
                  <hr className="border-gray-200" />
                  <PayrollRow label="Total Pay" value={`£${selectedPayroll.data.totalPay.toFixed(2)}`} bold large />
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={() => handleExportExcel(selectedPayroll.carer)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                    <Download size={14} /> Excel
                  </button>
                  <button onClick={() => handleExportCSV(selectedPayroll.carer)}
                    className="flex-1 flex items-center justify-center gap-2 bg-hgc-600 text-white px-3 py-2 rounded-lg hover:bg-hgc-700 transition-colors text-sm font-medium">
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PayrollRow({ label, value, bold, large }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`${large ? 'text-lg' : 'text-sm'} ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  )
}
