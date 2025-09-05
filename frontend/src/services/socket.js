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
  // pending listeners registered before socket exists
  this._pendingListeners = new Map()
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

      // Attach any pending listeners
      for (const [event, callbacks] of this._pendingListeners.entries()) {
        for (const cb of callbacks) {
          try { this.socket.on(event, cb) } catch (err) { console.error('attach pending listener err', err) }
        }
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
  // keep pending listeners so they re-attach on next connect
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    } else {
      if (!this._pendingListeners.has(event)) this._pendingListeners.set(event, new Set())
      this._pendingListeners.get(event).add(callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }

    if (this._pendingListeners.has(event)) {
      if (callback) {
        this._pendingListeners.get(event).delete(callback)
        if (this._pendingListeners.get(event).size === 0) this._pendingListeners.delete(event)
      } else {
        this._pendingListeners.delete(event)
      }
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
