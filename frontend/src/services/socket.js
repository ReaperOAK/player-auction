import { io } from 'socket.io-client'
import { auctionApi } from './api'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  connect(user = null) {
    if (this.socket) {
      this.disconnect()
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Join appropriate room based on user role
      if (user) {
        this.socket.emit('join_room', {
          role: user.role,
          teamId: user.id
        })
      } else {
        // Default to viewer
        this.socket.emit('join_room', { role: 'viewer' })
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 Reconnected after ${attemptNumber} attempts`)
      this.reconnectAttempts = 0
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event, data) {
    // Allow emitting even if `isConnected` not yet true; socket.io will queue emits until connected
    if (this.socket) {
      try {
        this.socket.emit(event, data)
      } catch (err) {
        console.error('Socket emit error:', err)
      }
    }
  }

  // Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket.connect()
    }
  }

  // Auction specific methods
  startTimer(duration) {
    this.emit('start_timer', { duration })
  }

  pauseTimer() {
    this.emit('pause_timer')
  }

  resumeTimer() {
    this.emit('resume_timer')
  }

  placeBid(bidData) {
  // Use REST endpoint for placing bids to ensure server-side validation and single source of truth
  // bidData may be a number or object; auctionApi.placeBid expects bidAmount
  const amount = typeof bidData === 'object' ? bidData.bidAmount || bidData.amount : bidData
  return auctionApi.placeBid(amount)
  }

  adminAction(action) {
    this.emit('admin_action', action)
  }

  sendChatMessage(message) {
    this.emit('chat_message', message)
  }
}

export default new SocketService()
