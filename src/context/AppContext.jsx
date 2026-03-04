import { createContext, useContext, useState, useCallback } from 'react'
import {
  initialiseStore,
  createCarer,
  updateCarer as storUpdateCarer,
  deleteCarer as storDeleteCarer,
  createClient,
  updateClient as storUpdateClient,
  deleteClient as storDeleteClient,
  createShift,
  updateShift as storUpdateShift,
  deleteShift as storDeleteShift,
  getShiftsForDate,
  getShiftsForMonth,
  getCarerMonthlyStats,
  resetStore,
} from '../data/store'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [state, setState] = useState(() => initialiseStore())

  // ── Carer operations ───────────────────────────────────────────────────────

  const addCarer = useCallback((data) => {
    setState(prev => {
      const { updated, carer } = createCarer(prev.carers, data)
      return { ...prev, carers: updated }
    })
  }, [])

  const updateCarer = useCallback((id, data) => {
    setState(prev => ({
      ...prev,
      carers: storUpdateCarer(prev.carers, id, data),
    }))
  }, [])

  const deleteCarer = useCallback((id) => {
    setState(prev => {
      const { updatedCarers, updatedShifts } = storDeleteCarer(prev.carers, prev.shifts, id)
      return { ...prev, carers: updatedCarers, shifts: updatedShifts }
    })
  }, [])

  // ── Client operations ──────────────────────────────────────────────────────

  const addClient = useCallback((data) => {
    setState(prev => {
      const { updated, client } = createClient(prev.clients, data)
      return { ...prev, clients: updated }
    })
  }, [])

  const updateClient = useCallback((id, data) => {
    setState(prev => ({
      ...prev,
      clients: storUpdateClient(prev.clients, id, data),
    }))
  }, [])

  const deleteClient = useCallback((id) => {
    setState(prev => {
      const { updatedClients, updatedShifts } = storDeleteClient(prev.clients, prev.shifts, id)
      return { ...prev, clients: updatedClients, shifts: updatedShifts }
    })
  }, [])

  // ── Shift operations ───────────────────────────────────────────────────────

  const addShift = useCallback((data) => {
    setState(prev => {
      const { updated, shift } = createShift(prev.shifts, data)
      return { ...prev, shifts: updated }
    })
  }, [])

  const updateShift = useCallback((id, data) => {
    setState(prev => ({
      ...prev,
      shifts: storUpdateShift(prev.shifts, id, data),
    }))
  }, [])

  const deleteShift = useCallback((id) => {
    setState(prev => ({
      ...prev,
      shifts: storDeleteShift(prev.shifts, id),
    }))
  }, [])

  // ── Query helpers ──────────────────────────────────────────────────────────

  const getShiftsOnDate = useCallback(
    (date) => getShiftsForDate(state.shifts, date),
    [state.shifts]
  )

  const getMonthShifts = useCallback(
    (year, month) => getShiftsForMonth(state.shifts, year, month),
    [state.shifts]
  )

  const getCarerStats = useCallback(
    (carerId, year, month) => getCarerMonthlyStats(state.shifts, carerId, year, month),
    [state.shifts]
  )

  // ── Reset (dev helper) ────────────────────────────────────────────────────

  const resetAllData = useCallback(() => {
    setState(resetStore())
  }, [])

  const value = {
    carers: state.carers,
    clients: state.clients,
    shifts: state.shifts,
    addCarer,
    updateCarer,
    deleteCarer,
    addClient,
    updateClient,
    deleteClient,
    addShift,
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
