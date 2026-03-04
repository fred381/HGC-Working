import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SHIFT_TYPES } from '../data/store'

const AppContext = createContext()

// ── Helpers to convert between DB snake_case and app camelCase ──────────────

function carerFromRow(r) {
  return {
    id: r.id,
    name: r.name,
    employeeId: r.employee_id,
    role: r.role,
    contactNumber: r.contact_number,
    dailyRate: parseFloat(r.daily_rate) || 0,
    active: r.active,
  }
}

function clientFromRow(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    careNeeds: r.care_needs,
    address: r.address,
    active: r.active,
  }
}

function shiftFromRow(r) {
  return {
    id: r.id,
    carerId: r.carer_id,
    clientId: r.client_id,
    date: r.date,
    shiftType: r.shift_type,
    notes: r.notes,
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [carers, setCarers] = useState([])
  const [clients, setClients] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAll() {
      const [carersRes, clientsRes, shiftsRes] = await Promise.all([
        supabase.from('carers').select('*').order('created_at'),
        supabase.from('clients').select('*').order('created_at'),
        supabase.from('shifts').select('*').order('created_at'),
      ])
      if (carersRes.data) setCarers(carersRes.data.map(carerFromRow))
      if (clientsRes.data) setClients(clientsRes.data.map(clientFromRow))
      if (shiftsRes.data) setShifts(shiftsRes.data.map(shiftFromRow))
      setLoading(false)
    }
    loadAll()
  }, [])

  // ── Carer operations ─────────────────────────────────────────────────────

  const addCarer = useCallback(async (data) => {
    const row = {
      name: data.name,
      employee_id: data.employeeId || '',
      role: data.role || 'Carer',
      contact_number: data.contactNumber || '',
      daily_rate: parseFloat(data.dailyRate) || 0,
      active: true,
    }
    const { data: rows, error } = await supabase.from('carers').insert(row).select()
    if (error) { console.error('addCarer', error); return }
    setCarers(prev => [...prev, carerFromRow(rows[0])])
  }, [])

  const updateCarer = useCallback(async (id, data) => {
    const updates = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.employeeId !== undefined) updates.employee_id = data.employeeId
    if (data.role !== undefined) updates.role = data.role
    if (data.contactNumber !== undefined) updates.contact_number = data.contactNumber
    if (data.dailyRate !== undefined) updates.daily_rate = parseFloat(data.dailyRate) || 0
    if (data.active !== undefined) updates.active = data.active

    const { error } = await supabase.from('carers').update(updates).eq('id', id)
    if (error) { console.error('updateCarer', error); return }
    setCarers(prev => prev.map(c =>
      c.id === id
        ? {
            ...c,
            name: data.name ?? c.name,
            employeeId: data.employeeId ?? c.employeeId,
            role: data.role ?? c.role,
            contactNumber: data.contactNumber ?? c.contactNumber,
            dailyRate: data.dailyRate !== undefined ? (parseFloat(data.dailyRate) || 0) : c.dailyRate,
            active: data.active !== undefined ? data.active : c.active,
          }
        : c
    ))
  }, [])

  const deleteCarer = useCallback(async (id) => {
    // Cascade delete on shifts handled by DB foreign key
    const { error } = await supabase.from('carers').delete().eq('id', id)
    if (error) { console.error('deleteCarer', error); return }
    setCarers(prev => prev.filter(c => c.id !== id))
    setShifts(prev => prev.filter(s => s.carerId !== id))
  }, [])

  // ── Client operations ────────────────────────────────────────────────────

  const addClient = useCallback(async (data) => {
    const row = {
      client_id: data.clientId || '',
      name: data.name,
      care_needs: data.careNeeds || '',
      address: data.address || '',
      active: true,
    }
    const { data: rows, error } = await supabase.from('clients').insert(row).select()
    if (error) { console.error('addClient', error); return }
    setClients(prev => [...prev, clientFromRow(rows[0])])
  }, [])

  const updateClient = useCallback(async (id, data) => {
    const updates = {}
    if (data.clientId !== undefined) updates.client_id = data.clientId
    if (data.name !== undefined) updates.name = data.name
    if (data.careNeeds !== undefined) updates.care_needs = data.careNeeds
    if (data.address !== undefined) updates.address = data.address
    if (data.active !== undefined) updates.active = data.active

    const { error } = await supabase.from('clients').update(updates).eq('id', id)
    if (error) { console.error('updateClient', error); return }
    setClients(prev => prev.map(c =>
      c.id === id
        ? {
            ...c,
            clientId: data.clientId ?? c.clientId,
            name: data.name ?? c.name,
            careNeeds: data.careNeeds ?? c.careNeeds,
            address: data.address ?? c.address,
            active: data.active !== undefined ? data.active : c.active,
          }
        : c
    ))
  }, [])

  const deleteClient = useCallback(async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { console.error('deleteClient', error); return }
    setClients(prev => prev.filter(c => c.id !== id))
    setShifts(prev => prev.filter(s => s.clientId !== id))
  }, [])

  // ── Shift operations ─────────────────────────────────────────────────────

  const addShift = useCallback(async (data) => {
    const row = {
      carer_id: data.carerId,
      client_id: data.clientId,
      date: data.date,
      shift_type: data.shiftType || 'full_day',
      notes: data.notes || '',
    }
    const { data: rows, error } = await supabase.from('shifts').insert(row).select()
    if (error) { console.error('addShift', error); return }
    setShifts(prev => [...prev, shiftFromRow(rows[0])])
  }, [])

  const addShiftsBatch = useCallback(async (dataArray) => {
    const rows = dataArray.map(d => ({
      carer_id: d.carerId,
      client_id: d.clientId,
      date: d.date,
      shift_type: d.shiftType || 'full_day',
      notes: d.notes || '',
    }))
    const { data: inserted, error } = await supabase.from('shifts').insert(rows).select()
    if (error) { console.error('addShiftsBatch', error); return }
    setShifts(prev => [...prev, ...inserted.map(shiftFromRow)])
  }, [])

  const updateShift = useCallback(async (id, data) => {
    const updates = {}
    if (data.shiftType !== undefined) updates.shift_type = data.shiftType
    if (data.notes !== undefined) updates.notes = data.notes
    if (data.carerId !== undefined) updates.carer_id = data.carerId
    if (data.clientId !== undefined) updates.client_id = data.clientId
    if (data.date !== undefined) updates.date = data.date

    const { error } = await supabase.from('shifts').update(updates).eq('id', id)
    if (error) { console.error('updateShift', error); return }
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }, [])

  const deleteShift = useCallback(async (id) => {
    const { error } = await supabase.from('shifts').delete().eq('id', id)
    if (error) { console.error('deleteShift', error); return }
    setShifts(prev => prev.filter(s => s.id !== id))
  }, [])

  // ── Query helpers (computed from local state, same as before) ────────────

  const getShiftsOnDate = useCallback(
    (date) => shifts.filter(s => s.date === date),
    [shifts]
  )

  const getMonthShifts = useCallback(
    (year, month) => {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      return shifts.filter(s => s.date.startsWith(prefix))
    },
    [shifts]
  )

  const getCarerStats = useCallback(
    (carerId, year, month) => {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
      const carerShifts = shifts.filter(s => s.carerId === carerId && s.date.startsWith(prefix))
      const uniqueDays = new Set(carerShifts.map(s => s.date))
      const totalHours = carerShifts.reduce(
        (sum, s) => sum + (SHIFT_TYPES[s.shiftType]?.hours || 0), 0
      )
      return { daysWorked: uniqueDays.size, totalHours, shiftCount: carerShifts.length }
    },
    [shifts]
  )

  const resetAllData = useCallback(() => {
    console.warn('resetAllData is not supported with Supabase backend')
  }, [])

  const value = {
    carers,
    clients,
    shifts,
    loading,
    addCarer,
    updateCarer,
    deleteCarer,
    addClient,
    updateClient,
    deleteClient,
    addShift,
    addShiftsBatch,
    updateShift,
    deleteShift,
    getShiftsOnDate,
    getMonthShifts,
    getCarerStats,
    resetAllData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
