import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const AppContext = createContext()

const STORAGE_KEYS = {
  CLIENTS: 'hgc_clients',
  CARERS: 'hgc_carers',
  ASSIGNMENTS: 'hgc_assignments',
}

function loadFromStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function AppProvider({ children }) {
  const [clients, setClients] = useState(() => loadFromStorage(STORAGE_KEYS.CLIENTS))
  const [carers, setCarers] = useState(() => loadFromStorage(STORAGE_KEYS.CARERS))
  const [assignments, setAssignments] = useState(() => loadFromStorage(STORAGE_KEYS.ASSIGNMENTS))

  // Client operations
  const addClient = useCallback((client) => {
    const newClient = { ...client, id: uuidv4() }
    setClients(prev => {
      const updated = [...prev, newClient]
      saveToStorage(STORAGE_KEYS.CLIENTS, updated)
      return updated
    })
    return newClient
  }, [])

  const updateClient = useCallback((id, updates) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      saveToStorage(STORAGE_KEYS.CLIENTS, updated)
      return updated
    })
  }, [])

  const deleteClient = useCallback((id) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveToStorage(STORAGE_KEYS.CLIENTS, updated)
      return updated
    })
    // Also remove assignments for this client
    setAssignments(prev => {
      const updated = prev.filter(a => a.clientId !== id)
      saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated)
      return updated
    })
  }, [])

  // Carer operations
  const addCarer = useCallback((carer) => {
    const newCarer = { ...carer, id: uuidv4() }
    setCarers(prev => {
      const updated = [...prev, newCarer]
      saveToStorage(STORAGE_KEYS.CARERS, updated)
      return updated
    })
    return newCarer
  }, [])

  const updateCarer = useCallback((id, updates) => {
    setCarers(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      saveToStorage(STORAGE_KEYS.CARERS, updated)
      return updated
    })
  }, [])

  const deleteCarer = useCallback((id) => {
    setCarers(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveToStorage(STORAGE_KEYS.CARERS, updated)
      return updated
    })
    // Also remove assignments for this carer
    setAssignments(prev => {
      const updated = prev.filter(a => a.carerId !== id)
      saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated)
      return updated
    })
  }, [])

  // Assignment operations
  const addAssignment = useCallback((assignment) => {
    const newAssignment = { ...assignment, id: uuidv4() }
    setAssignments(prev => {
      const updated = [...prev, newAssignment]
      saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated)
      return updated
    })
    return newAssignment
  }, [])

  const removeAssignment = useCallback((id) => {
    setAssignments(prev => {
      const updated = prev.filter(a => a.id !== id)
      saveToStorage(STORAGE_KEYS.ASSIGNMENTS, updated)
      return updated
    })
  }, [])

  const getAssignmentsForDate = useCallback((date) => {
    return assignments.filter(a => a.date === date)
  }, [assignments])

  const getAssignmentsForMonth = useCallback((year, month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return assignments.filter(a => a.date.startsWith(prefix))
  }, [assignments])

  const getCarerMonthlyDays = useCallback((carerId, year, month) => {
    const monthAssignments = getAssignmentsForMonth(year, month)
    const carerAssignments = monthAssignments.filter(a => a.carerId === carerId)
    const uniqueDays = new Set(carerAssignments.map(a => a.date))
    return uniqueDays.size
  }, [getAssignmentsForMonth])

  const value = {
    clients,
    carers,
    assignments,
    addClient,
    updateClient,
    deleteClient,
    addCarer,
    updateCarer,
    deleteCarer,
    addAssignment,
    removeAssignment,
    getAssignmentsForDate,
    getAssignmentsForMonth,
    getCarerMonthlyDays,
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
