import { useState, useEffect } from 'react'
import { auctionApi, teamsApi } from '../services/api'

export const useAuctionHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await auctionApi.getHistory()
      setHistory(response.data.soldPlayers)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch auction history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  }
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await teamsApi.getLeaderboard()
      setLeaderboard(response.data.leaderboard)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard
  }
}

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
