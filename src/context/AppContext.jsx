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
    email: r.email || '',
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

function tagFromRow(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    date: r.date,
    tagType: r.tag_type,
    notes: r.notes || '',
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [carers, setCarers] = useState([])
  const [clients, setClients] = useState([])
  const [shifts, setShifts] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAll() {
      const [carersRes, clientsRes, shiftsRes, tagsRes] = await Promise.all([
        supabase.from('carers').select('*').order('created_at'),
        supabase.from('clients').select('*').order('created_at'),
        supabase.from('shifts').select('*').order('created_at'),
        supabase.from('tags').select('*').order('created_at'),
      ])
      if (carersRes.data) setCarers(carersRes.data.map(carerFromRow))
      if (clientsRes.data) setClients(clientsRes.data.map(clientFromRow))
      if (shiftsRes.data) setShifts(shiftsRes.data.map(shiftFromRow))
      if (tagsRes.data) setTags(tagsRes.data.map(tagFromRow))
      setLoading(false)
    }
    loadAll()

    // ── Real-time subscriptions ───────────────────────────────────────────
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTags(prev => {
            if (prev.some(t => t.id === payload.new.id)) return prev
            return [...prev, tagFromRow(payload.new)]
          })
        } else if (payload.eventType === 'UPDATE') {
          setTags(prev => prev.map(t => t.id === payload.new.id ? tagFromRow(payload.new) : t))
        } else if (payload.eventType === 'DELETE') {
          setTags(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setShifts(prev => {
            if (prev.some(s => s.id === payload.new.id)) return prev
            return [...prev, shiftFromRow(payload.new)]
          })
        } else if (payload.eventType === 'UPDATE') {
          setShifts(prev => prev.map(s => s.id === payload.new.id ? shiftFromRow(payload.new) : s))
        } else if (payload.eventType === 'DELETE') {
          setShifts(prev => prev.filter(s => s.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Carer operations ─────────────────────────────────────────────────────

  const addCarer = useCallback(async (data) => {
    const row = {
      name: data.name,
      employee_id: data.employeeId || '',
      role: data.role || 'Carer',
      email: data.email || '',
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
    if (data.email !== undefined) updates.email = data.email
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
            email: data.email ?? c.email,
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

  // ── Tag operations ──────────────────────────────────────────────────────

  const addTag = useCallback(async (data) => {
    const row = {
      client_id: data.clientId,
      date: data.date,
      tag_type: data.tagType,
      notes: data.notes || '',
    }
    const { data: rows, error } = await supabase.from('tags').insert(row).select()
    if (error) { console.error('addTag', error); return }
    setTags(prev => [...prev, tagFromRow(rows[0])])
  }, [])

  const updateTag = useCallback(async (id, data) => {
    const updates = {}
    if (data.tagType !== undefined) updates.tag_type = data.tagType
    if (data.notes !== undefined) updates.notes = data.notes
    const { error } = await supabase.from('tags').update(updates).eq('id', id)
    if (error) { console.error('updateTag', error); return }
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }, [])

  const deleteTag = useCallback(async (id) => {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) { console.error('deleteTag', error); return }
    setTags(prev => prev.filter(t => t.id !== id))
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
    tags,
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
    addTag,
    updateTag,
    deleteTag,
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
