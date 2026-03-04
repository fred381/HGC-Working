import * as XLSX from 'xlsx'
import { SHIFT_TYPES } from '../data/store'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function generatePayrollData(carer, shifts, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const carerShifts = shifts.filter(
    s => s.carerId === carer.id && s.date.startsWith(prefix)
  )

  const uniqueDays = [...new Set(carerShifts.map(s => s.date))].sort()
  const daysWorked = uniqueDays.length

  const hourlyRate = parseFloat(carer.hourlyRate) || 0

  // Break down by shift type
  const shiftBreakdown = {}
  let totalHours = 0
  for (const s of carerShifts) {
    const info = SHIFT_TYPES[s.shiftType] || SHIFT_TYPES.full_day
    const key = s.shiftType
    if (!shiftBreakdown[key]) {
      shiftBreakdown[key] = { label: info.label, hours: info.hours, count: 0, totalHours: 0 }
    }
    shiftBreakdown[key].count++
    shiftBreakdown[key].totalHours += info.hours
    totalHours += info.hours
  }

  const grossPay = totalHours * hourlyRate
  const holidayPay = grossPay * 0.1207 // UK statutory 12.07%
  const totalPay = grossPay + holidayPay

  return {
    carerName: carer.name,
    employeeId: carer.employeeId || 'N/A',
    role: carer.role || 'Carer',
    month: MONTH_NAMES[month],
    year,
    daysWorked,
    totalHours,
    hourlyRate,
    shiftBreakdown,
    shiftCount: carerShifts.length,
    grossPay,
    holidayPay,
    totalPay,
    datesWorked: uniqueDays,
  }
}

export function exportPayrollToExcel(payrollData, carer) {
  const rows = [
    ['Hamilton George Care — Payroll Sheet'],
    [],
    ['Carer Name', payrollData.carerName],
    ['Employee ID', payrollData.employeeId],
    ['Role', payrollData.role],
    ['Month', `${payrollData.month} ${payrollData.year}`],
    [],
    ['Shift Breakdown'],
    ['Type', 'Count', 'Hours per Shift', 'Total Hours'],
  ]

  for (const [, info] of Object.entries(payrollData.shiftBreakdown)) {
    rows.push([info.label, info.count, info.hours, info.totalHours])
  }

  rows.push(
    [],
    ['Summary'],
    ['Total Shifts', payrollData.shiftCount],
    ['Days Worked', payrollData.daysWorked],
    ['Total Hours', payrollData.totalHours],
    ['Hourly Rate (£)', payrollData.hourlyRate.toFixed(2)],
    ['Gross Pay (£)', payrollData.grossPay.toFixed(2)],
    ['Holiday Pay (12.07%) (£)', payrollData.holidayPay.toFixed(2)],
    [],
    ['Total Pay (£)', payrollData.totalPay.toFixed(2)],
    [],
    [],
    ['Dates Worked'],
  )

  for (const date of payrollData.datesWorked) {
    rows.push([date])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll')

  const fileName = `Payroll_${payrollData.carerName.replace(/\s+/g, '_')}_${payrollData.month}_${payrollData.year}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export function exportPayrollToCSV(payrollData, carer) {
  const rows = [
    ['Hamilton George Care — Payroll Sheet'],
    [],
    ['Carer Name', payrollData.carerName],
    ['Employee ID', payrollData.employeeId],
    ['Role', payrollData.role],
    ['Month', `${payrollData.month} ${payrollData.year}`],
    [],
    ['Shift Breakdown'],
    ['Type', 'Count', 'Hours per Shift', 'Total Hours'],
  ]

  for (const [, info] of Object.entries(payrollData.shiftBreakdown)) {
    rows.push([info.label, info.count, info.hours, info.totalHours])
  }

  rows.push(
    [],
    ['Summary'],
    ['Total Shifts', payrollData.shiftCount],
    ['Days Worked', payrollData.daysWorked],
    ['Total Hours', payrollData.totalHours],
    ['Hourly Rate (GBP)', payrollData.hourlyRate.toFixed(2)],
    ['Gross Pay (GBP)', payrollData.grossPay.toFixed(2)],
    ['Holiday Pay 12.07% (GBP)', payrollData.holidayPay.toFixed(2)],
    [],
    ['Total Pay (GBP)', payrollData.totalPay.toFixed(2)],
    [],
    ['Dates Worked'],
  )

  for (const date of payrollData.datesWorked) {
    rows.push([date])
  }

  const csvContent = rows.map(row =>
    row.map(cell => {
      const str = String(cell ?? '')
      return str.includes(',') ? `"${str}"` : str
    }).join(',')
  ).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Payroll_${payrollData.carerName.replace(/\s+/g, '_')}_${payrollData.month}_${payrollData.year}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
