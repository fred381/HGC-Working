import * as XLSX from 'xlsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function generatePayrollData(carer, assignments, year, month) {
  const monthAssignments = assignments.filter(a => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return a.carerId === carer.id && a.date.startsWith(prefix)
  })

  const uniqueDays = [...new Set(monthAssignments.map(a => a.date))].sort()
  const daysWorked = uniqueDays.length

  const dailyRate = parseFloat(carer.dailyRate) || 0
  const travelAllowance = parseFloat(carer.travelAllowance) || 0
  const foodAllowance = parseFloat(carer.foodAllowance) || 0
  const extras = parseFloat(carer.extras) || 0

  const grossPay = daysWorked * dailyRate
  const totalTravel = daysWorked * travelAllowance
  const totalFood = daysWorked * foodAllowance
  const holidayPay = grossPay * 0.1207 // UK statutory holiday pay accrual (12.07%)
  const totalPay = grossPay + totalTravel + totalFood + extras + holidayPay

  return {
    carerName: carer.name,
    month: MONTH_NAMES[month],
    year,
    daysWorked,
    dailyRate,
    grossPay,
    travelAllowance,
    totalTravel,
    foodAllowance,
    totalFood,
    extras,
    holidayPay,
    totalPay,
    datesWorked: uniqueDays,
  }
}

export function exportPayrollToExcel(payrollData, carer) {
  const summaryData = [
    ['Hamilton George Care - Payroll Sheet'],
    [],
    ['Carer Name', payrollData.carerName],
    ['Month', `${payrollData.month} ${payrollData.year}`],
    ['Employee ID', carer.employeeId || 'N/A'],
    ['NI Number', carer.niNumber || 'N/A'],
    [],
    ['Summary'],
    ['Days Worked', payrollData.daysWorked],
    ['Daily Rate (£)', payrollData.dailyRate.toFixed(2)],
    ['Gross Pay (£)', payrollData.grossPay.toFixed(2)],
    ['Travel Allowance per Day (£)', payrollData.travelAllowance.toFixed(2)],
    ['Total Travel (£)', payrollData.totalTravel.toFixed(2)],
    ['Food Allowance per Day (£)', payrollData.foodAllowance.toFixed(2)],
    ['Total Food (£)', payrollData.totalFood.toFixed(2)],
    ['Extras/Bonuses (£)', payrollData.extras.toFixed(2)],
    ['Holiday Pay (12.07%) (£)', payrollData.holidayPay.toFixed(2)],
    [],
    ['Total Pay (£)', payrollData.totalPay.toFixed(2)],
    [],
    [],
    ['Dates Worked'],
  ]

  payrollData.datesWorked.forEach(date => {
    summaryData.push([date])
  })

  const ws = XLSX.utils.aoa_to_sheet(summaryData)

  // Set column widths
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll')

  const fileName = `Payroll_${payrollData.carerName.replace(/\s+/g, '_')}_${payrollData.month}_${payrollData.year}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export function exportPayrollToCSV(payrollData, carer) {
  const rows = [
    ['Hamilton George Care - Payroll Sheet'],
    [],
    ['Carer Name', payrollData.carerName],
    ['Month', `${payrollData.month} ${payrollData.year}`],
    ['Employee ID', carer.employeeId || 'N/A'],
    ['NI Number', carer.niNumber || 'N/A'],
    [],
    ['Summary'],
    ['Days Worked', payrollData.daysWorked],
    ['Daily Rate (GBP)', payrollData.dailyRate.toFixed(2)],
    ['Gross Pay (GBP)', payrollData.grossPay.toFixed(2)],
    ['Travel Allowance per Day (GBP)', payrollData.travelAllowance.toFixed(2)],
    ['Total Travel (GBP)', payrollData.totalTravel.toFixed(2)],
    ['Food Allowance per Day (GBP)', payrollData.foodAllowance.toFixed(2)],
    ['Total Food (GBP)', payrollData.totalFood.toFixed(2)],
    ['Extras/Bonuses (GBP)', payrollData.extras.toFixed(2)],
    ['Holiday Pay 12.07% (GBP)', payrollData.holidayPay.toFixed(2)],
    [],
    ['Total Pay (GBP)', payrollData.totalPay.toFixed(2)],
    [],
    ['Dates Worked'],
  ]

  payrollData.datesWorked.forEach(date => {
    rows.push([date])
  })

  const csvContent = rows.map(row => row.map(cell => {
    const str = String(cell ?? '')
    return str.includes(',') ? `"${str}"` : str
  }).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Payroll_${payrollData.carerName.replace(/\s+/g, '_')}_${payrollData.month}_${payrollData.year}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
