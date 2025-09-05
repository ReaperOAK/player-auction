import React, { createContext, useContext, useReducer, useEffect } from 'react'
import socketService from '../services/socket'
import { auctionApi } from '../services/api'
import { playSound, createConfetti } from '../utils/helpers'

const AuctionContext = createContext()

const auctionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_AUCTION_STATE':
      return {
        ...state,
        auctionState: action.payload,
        loading: false,
      }
    case 'UPDATE_TIMER':
      return {
        ...state,
        auctionState: {
          ...state.auctionState,
          time_left: action.payload,
        },
      }
    case 'NEW_BID':
      return {
        ...state,
        auctionState: action.payload,
        lastBid: {
          amount: action.payload.current_bid,
          teamName: action.teamName,
          timestamp: Date.now(),
        },
      }
    case 'PLAYER_SOLD':
      return {
        ...state,
        lastSale: action.payload,
        auctionState: {
          ...state.auctionState,
          status: 'not_started',
          current_player_id: null,
          current_bid: 0,
          current_bidder: null,
        },
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
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

const initialState = {
  auctionState: null,
  lastBid: null,
  lastSale: null,
  loading: true,
  error: null,
}

export const AuctionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(auctionReducer, initialState)

  useEffect(() => {
    // Fetch initial auction state
    fetchAuctionState()

    // Set up socket listeners
    socketService.on('auction_started', handleAuctionStarted)
    socketService.on('auction_paused', handleAuctionPaused)
    socketService.on('auction_resumed', handleAuctionResumed)
    socketService.on('auction_ended', handleAuctionEnded)
    socketService.on('new_bid', handleNewBid)
    socketService.on('timer_update', handleTimerUpdate)
    socketService.on('player_sold', handlePlayerSold)
    socketService.on('player_unsold', handlePlayerUnsold)

    return () => {
      // Cleanup socket listeners
      socketService.off('auction_started', handleAuctionStarted)
      socketService.off('auction_paused', handleAuctionPaused)
      socketService.off('auction_resumed', handleAuctionResumed)
      socketService.off('auction_ended', handleAuctionEnded)
      socketService.off('new_bid', handleNewBid)
      socketService.off('timer_update', handleTimerUpdate)
      socketService.off('player_sold', handlePlayerSold)
      socketService.off('player_unsold', handlePlayerUnsold)
    }
  }, [])

  const fetchAuctionState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await auctionApi.getState()
      dispatch({
        type: 'SET_AUCTION_STATE',
        payload: response.data.auctionState
      })
    } catch (error) {
      console.error('Error fetching auction state:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to fetch auction state'
      })
    }
  }

  const handleAuctionStarted = (data) => {
    dispatch({
      type: 'SET_AUCTION_STATE',
      payload: data.auctionState
    })
    playSound('bid')
  }

  const handleAuctionPaused = (data) => {
    dispatch({
      type: 'SET_AUCTION_STATE',
      payload: data.auctionState
    })
  }

  const handleAuctionResumed = (data) => {
    dispatch({
      type: 'SET_AUCTION_STATE',
      payload: data.auctionState
    })
  }

  const handleAuctionEnded = (data) => {
    dispatch({
      type: 'SET_AUCTION_STATE',
      payload: data.auctionState
    })
  }

  const handleNewBid = (data) => {
    dispatch({
      type: 'NEW_BID',
      payload: data.auctionState,
      teamName: data.teamName
    })
    playSound('bid')
  }

  const handleTimerUpdate = (data) => {
    dispatch({
      type: 'UPDATE_TIMER',
      payload: data.timeLeft
    })
    
    // Play timer sound for last 5 seconds
    if (data.timeLeft <= 5 && data.timeLeft > 0) {
      playSound('timer')
    }
  }

  const handlePlayerSold = (data) => {
    dispatch({
      type: 'PLAYER_SOLD',
      payload: data
    })
    playSound('sold')
    createConfetti()
  }

  const handlePlayerUnsold = (data) => {
    dispatch({
      type: 'PLAYER_SOLD',
      payload: { ...data, unsold: true }
    })
  }

  // Action creators
  const startAuction = async (playerId, config) => {
    try {
      const response = await auctionApi.startAuction(playerId, config)
      return response.data
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to start auction'
      })
      throw error
    }
  }

  const pauseAuction = async () => {
    try {
      const response = await auctionApi.pauseAuction()
      return response.data
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to pause auction'
      })
      throw error
    }
  }

  const resumeAuction = async () => {
    try {
      const response = await auctionApi.resumeAuction()
      return response.data
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to resume auction'
      })
      throw error
    }
  }

  const endAuction = async () => {
    try {
      const response = await auctionApi.endAuction()
      return response.data
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to end auction'
      })
      throw error
    }
  }

  const placeBid = async (bidAmount) => {
    try {
      const response = await auctionApi.placeBid(bidAmount)
      return response.data
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to place bid'
      })
      throw error
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    startAuction,
    pauseAuction,
    resumeAuction,
    endAuction,
    placeBid,
    clearError,
    refetchState: fetchAuctionState,
  }

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  )
}

export const useAuction = () => {
  const context = useContext(AuctionContext)
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider')
  }
  return context
}
