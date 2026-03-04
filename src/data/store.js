import { v4 as uuidv4 } from 'uuid'

// ─── Shift type definitions ───────────────────────────────────────────────────
// Each shift type maps to a number of hours for payroll calculation.

export const SHIFT_TYPES = {
  morning:   { label: 'Morning',   hours: 6  },
  afternoon: { label: 'Afternoon', hours: 6  },
  full_day:  { label: 'Full Day',  hours: 12 },
  night:     { label: 'Night',     hours: 10 },
}

export const CARER_ROLES = [
  'Carer',
  'Senior Carer',
  'Team Leader',
  'Care Coordinator',
]

// ─── localStorage keys ───────────────────────────────────────────────────────

const STORAGE_KEYS = {
  CARERS:  'hgc_carers',
  CLIENTS: 'hgc_clients',
  SHIFTS:  'hgc_shifts',
  SEEDED:  'hgc_seeded',
}

// ─── Sample data ─────────────────────────────────────────────────────────────

function buildSampleData() {
  const carers = [
    {
      id: uuidv4(),
      name: 'Amina Osei',
      employeeId: 'HGC-001',
      role: 'Senior Carer',
      contactNumber: '07421 334 512',
      dailyRate: 120.00,
      active: true,
    },
    {
      id: uuidv4(),
      name: 'David Brennan',
      employeeId: 'HGC-002',
      role: 'Carer',
      contactNumber: '07553 221 087',
      dailyRate: 100.00,
      active: true,
    },
    {
      id: uuidv4(),
      name: 'Priya Sharma',
      employeeId: 'HGC-003',
      role: 'Team Leader',
      contactNumber: '07700 910 345',
      dailyRate: 140.00,
      active: true,
    },
    {
      id: uuidv4(),
      name: 'James Okonkwo',
      employeeId: 'HGC-004',
      role: 'Carer',
      contactNumber: '07812 456 223',
      dailyRate: 100.00,
      active: true,
    },
    {
      id: uuidv4(),
      name: 'Sophie Williams',
      employeeId: 'HGC-005',
      role: 'Senior Carer',
      contactNumber: '07934 678 112',
      dailyRate: 120.00,
      active: true,
    },
  ]

  const clients = [
    {
      id: uuidv4(),
      clientId: 'CLT-001',
      name: 'Margaret Thompson',
      careNeeds: 'Dementia support, medication management, mobility assistance',
      address: '14 Rosewood Lane, Bromley, BR1 3PQ',
      active: true,
    },
    {
      id: uuidv4(),
      clientId: 'CLT-002',
      name: 'Arthur Patel',
      careNeeds: 'Post-stroke rehabilitation, daily living support, physiotherapy exercises',
      address: '7 Elm Court, Croydon, CR0 6TH',
      active: true,
    },
    {
      id: uuidv4(),
      clientId: 'CLT-003',
      name: 'Doris Campbell',
      careNeeds: 'Palliative care, pain management, companionship',
      address: '22 Victoria Road, Lewisham, SE13 5NR',
      active: true,
    },
    {
      id: uuidv4(),
      clientId: 'CLT-004',
      name: 'Harold Jenkins',
      careNeeds: 'Diabetes management, meal preparation, personal hygiene assistance',
      address: '9 Birch Close, Greenwich, SE10 8AG',
      active: true,
    },
  ]

  // Generate sample shifts for the current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const shifts = []
  const shiftTypes = Object.keys(SHIFT_TYPES)

  // Create a spread of shifts across the month
  const pairings = [
    { carerIdx: 0, clientIdx: 0, type: 'morning' },
    { carerIdx: 0, clientIdx: 1, type: 'afternoon' },
    { carerIdx: 1, clientIdx: 2, type: 'full_day' },
    { carerIdx: 2, clientIdx: 0, type: 'night' },
    { carerIdx: 2, clientIdx: 3, type: 'morning' },
    { carerIdx: 3, clientIdx: 1, type: 'full_day' },
    { carerIdx: 3, clientIdx: 3, type: 'afternoon' },
    { carerIdx: 4, clientIdx: 2, type: 'morning' },
    { carerIdx: 4, clientIdx: 0, type: 'night' },
  ]

  for (let day = 1; day <= Math.min(now.getDate(), 28); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // Assign a subset of pairings each day to create realistic coverage
    const dayPairings = pairings.filter((_, i) => {
      // Rotate which pairings are active each day
      return (day + i) % 3 !== 0
    })
    for (const pairing of dayPairings) {
      shifts.push({
        id: uuidv4(),
        carerId: carers[pairing.carerIdx].id,
        clientId: clients[pairing.clientIdx].id,
        date: dateStr,
        shiftType: pairing.type,
        notes: '',
      })
    }
  }

  return { carers, clients, shifts }
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Initialisation ──────────────────────────────────────────────────────────
// Seeds sample data on first launch. Returns the initial state object.

export function initialiseStore() {
  const alreadySeeded = localStorage.getItem(STORAGE_KEYS.SEEDED) === 'true'

  if (!alreadySeeded) {
    const sample = buildSampleData()
    save(STORAGE_KEYS.CARERS, sample.carers)
    save(STORAGE_KEYS.CLIENTS, sample.clients)
    save(STORAGE_KEYS.SHIFTS, sample.shifts)
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true')
    return sample
  }

  return {
    carers:  load(STORAGE_KEYS.CARERS),
    clients: load(STORAGE_KEYS.CLIENTS),
    shifts:  load(STORAGE_KEYS.SHIFTS),
  }
}

// ─── CRUD operations ─────────────────────────────────────────────────────────
// Each function receives the current array, performs the operation, persists to
// localStorage, and returns the new array.

// — Carers —

export function createCarer(carers, data) {
  const carer = {
    id: uuidv4(),
    name: data.name,
    employeeId: data.employeeId || '',
    role: data.role || 'Carer',
    contactNumber: data.contactNumber || '',
    dailyRate: parseFloat(data.dailyRate) || 0,
    active: true,
  }
  const updated = [...carers, carer]
  save(STORAGE_KEYS.CARERS, updated)
  return { updated, carer }
}

export function updateCarer(carers, id, data) {
  const updated = carers.map(c =>
    c.id === id
      ? {
          ...c,
          name: data.name ?? c.name,
          employeeId: data.employeeId ?? c.employeeId,
          role: data.role ?? c.role,
          contactNumber: data.contactNumber ?? c.contactNumber,
          dailyRate: data.dailyRate !== undefined ? parseFloat(data.dailyRate) || 0 : c.dailyRate,
          active: data.active !== undefined ? data.active : (c.active ?? true),
        }
      : c
  )
  save(STORAGE_KEYS.CARERS, updated)
  return updated
}

export function deleteCarer(carers, shifts, id) {
  const updatedCarers = carers.filter(c => c.id !== id)
  const updatedShifts = shifts.filter(s => s.carerId !== id)
  save(STORAGE_KEYS.CARERS, updatedCarers)
  save(STORAGE_KEYS.SHIFTS, updatedShifts)
  return { updatedCarers, updatedShifts }
}

// — Clients —

export function createClient(clients, data) {
  const client = {
    id: uuidv4(),
    clientId: data.clientId || '',
    name: data.name,
    careNeeds: data.careNeeds || '',
    address: data.address || '',
    active: true,
  }
  const updated = [...clients, client]
  save(STORAGE_KEYS.CLIENTS, updated)
  return { updated, client }
}

export function updateClient(clients, id, data) {
  const updated = clients.map(c =>
    c.id === id
      ? {
          ...c,
          clientId: data.clientId ?? c.clientId,
          name: data.name ?? c.name,
          careNeeds: data.careNeeds ?? c.careNeeds,
          address: data.address ?? c.address,
          active: data.active !== undefined ? data.active : (c.active ?? true),
        }
      : c
  )
  save(STORAGE_KEYS.CLIENTS, updated)
  return updated
}

export function deleteClient(clients, shifts, id) {
  const updatedClients = clients.filter(c => c.id !== id)
  const updatedShifts = shifts.filter(s => s.clientId !== id)
  save(STORAGE_KEYS.CLIENTS, updatedClients)
  save(STORAGE_KEYS.SHIFTS, updatedShifts)
  return { updatedClients, updatedShifts }
}

// — Shifts —

export function createShift(shifts, data) {
  const shift = {
    id: uuidv4(),
    carerId: data.carerId,
    clientId: data.clientId,
    date: data.date,
    shiftType: data.shiftType || 'full_day',
    notes: data.notes || '',
  }
  const updated = [...shifts, shift]
  save(STORAGE_KEYS.SHIFTS, updated)
  return { updated, shift }
}

export function createShiftsBatch(shifts, dataArray) {
  const newShifts = dataArray.map(data => ({
    id: uuidv4(),
    carerId: data.carerId,
    clientId: data.clientId,
    date: data.date,
    shiftType: data.shiftType || 'full_day',
    notes: data.notes || '',
  }))
  const updated = [...shifts, ...newShifts]
  save(STORAGE_KEYS.SHIFTS, updated)
  return { updated, newShifts }
}

export function updateShift(shifts, id, data) {
  const updated = shifts.map(s =>
    s.id === id ? { ...s, ...data } : s
  )
  save(STORAGE_KEYS.SHIFTS, updated)
  return updated
}

export function deleteShift(shifts, id) {
  const updated = shifts.filter(s => s.id !== id)
  save(STORAGE_KEYS.SHIFTS, updated)
  return updated
}

// ─── Query helpers ───────────────────────────────────────────────────────────

export function getShiftsForDate(shifts, date) {
  return shifts.filter(s => s.date === date)
}

export function getShiftsForMonth(shifts, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return shifts.filter(s => s.date.startsWith(prefix))
}

export function getCarerMonthlyStats(shifts, carerId, year, month) {
  const monthShifts = getShiftsForMonth(shifts, year, month)
  const carerShifts = monthShifts.filter(s => s.carerId === carerId)
  const uniqueDays = new Set(carerShifts.map(s => s.date))
  const totalHours = carerShifts.reduce(
    (sum, s) => sum + (SHIFT_TYPES[s.shiftType]?.hours || 0),
    0
  )
  return { daysWorked: uniqueDays.size, totalHours, shiftCount: carerShifts.length }
}

// ─── Reset (useful for development) ──────────────────────────────────────────

export function resetStore() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  return initialiseStore()
}
