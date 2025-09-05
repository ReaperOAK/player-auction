import React, { createContext, useContext, useReducer, useEffect } from 'react'
import socketService from '../services/socket'

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    default:
      return state
  }
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing auth data on mount
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (token && user) {
      try {
        const userData = JSON.parse(user)
        dispatch({
          type: 'LOGIN',
          payload: { token, user: userData }
        })
        
        // Connect to socket with user data
        socketService.connect(userData)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        logout()
      }
    } else {
      // Even without authentication, connect as viewer for real-time updates
      socketService.connect(null)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    dispatch({
      type: 'LOGIN',
      payload: { token, user }
    })
    
    // Connect to socket with user data
    socketService.connect(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    dispatch({ type: 'LOGOUT' })
    
    // Disconnect from socket
    socketService.disconnect()
  }

  const setError = (error) => {
    dispatch({
      type: 'SET_ERROR',
      payload: error
    })
  }

  const clearError = () => {
    dispatch({
      type: 'SET_ERROR',
      payload: null
    })
  }

  const value = {
    ...state,
    login,
    logout,
    setError,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
