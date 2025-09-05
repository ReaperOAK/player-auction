import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(user) {
    if (this.socket) {
      this.disconnect()
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server')
      this.isConnected = true
      
      // Join appropriate room based on user role
      if (user) {
        this.socket.emit('join_room', {
          role: user.role,
          teamId: user.id
        })
      } else {
        // Viewer
        this.socket.emit('join_room', { role: 'viewer' })
      }
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
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
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
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
    this.emit('bid_placed', bidData)
  }

  adminAction(action) {
    this.emit('admin_action', action)
  }

  sendChatMessage(message) {
    this.emit('chat_message', message)
  }
}

export default new SocketService()
