import React, { useState, useEffect } from 'react'
import socketService from '../services/socket'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

const SocketStatus = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0
  })

  useEffect(() => {
    const updateStatus = () => {
      setStatus(socketService.getConnectionStatus())
    }

    // Update status every second
    const interval = setInterval(updateStatus, 1000)
    
    // Initial update
    updateStatus()

    return () => clearInterval(interval)
  }, [])

  const handleReconnect = () => {
    socketService.forceReconnect()
  }

  return (
    // outer wrapper should ignore pointer events so underlying UI (like navbar) remains clickable
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        ${status.isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }
        pointer-events-auto /* make the toast itself interactive where needed */
      `}>
        {status.isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <span>
          {status.isConnected ? 'Connected' : 'Disconnected'}
        </span>
        
        {status.socketId && (
          <span className="text-xs opacity-75">
            ({status.socketId.slice(0, 6)})
          </span>
        )}
        
        {status.reconnectAttempts > 0 && (
          <span className="text-xs">
            (Attempts: {status.reconnectAttempts})
          </span>
        )}
        
        {!status.isConnected && (
          <button
            onClick={handleReconnect}
            className="ml-2 p-1 hover:bg-red-200 rounded pointer-events-auto"
            title="Force reconnect"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

export default SocketStatus
