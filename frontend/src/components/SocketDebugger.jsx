import React, { useState, useEffect } from 'react'
import socketService from '../services/socket'

const SocketDebugger = () => {
  const [events, setEvents] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const addEvent = (eventName, data) => {
      const event = {
        id: Date.now(),
        name: eventName,
        data: JSON.stringify(data, null, 2),
        timestamp: new Date().toLocaleTimeString()
      }
      setEvents(prev => [event, ...prev.slice(0, 19)]) // Keep last 20 events
    }

    // Listen for all auction-related events
    const eventHandlers = {
      'connect': () => addEvent('connect', { socketId: socketService.getConnectionStatus().socketId }),
      'disconnect': (reason) => addEvent('disconnect', { reason }),
      'auction_started': (data) => addEvent('auction_started', data),
      'auction_paused': (data) => addEvent('auction_paused', data),
      'auction_resumed': (data) => addEvent('auction_resumed', data),
      'auction_ended': (data) => addEvent('auction_ended', data),
      'auction_state_update': (data) => addEvent('auction_state_update', data),
      'bid_update': (data) => addEvent('bid_update', data),
      'timer_update': (data) => addEvent('timer_update', data),
      'player_sold': (data) => addEvent('player_sold', data),
      'player_unsold': (data) => addEvent('player_unsold', data),
      'auction_auto_ended': () => addEvent('auction_auto_ended', {})
    }

    // Register all event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketService.on(event, handler)
    })

    return () => {
      // Cleanup all event listeners
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketService.off(event, handler)
      })
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        Debug Socket Events
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 text-green-400 p-4 rounded-lg shadow-lg overflow-hidden z-50 font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-bold">Socket Events</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setEvents([])}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-80 space-y-1">
        {events.length === 0 ? (
          <div className="text-gray-500">No events received yet...</div>
        ) : (
          events.map(event => (
            <div key={event.id} className="border-l-2 border-green-500 pl-2">
              <div className="text-yellow-400 font-bold">
                {event.timestamp} - {event.name}
              </div>
              {event.data !== '{}' && (
                <div className="text-green-300 text-xs whitespace-pre-wrap break-all">
                  {event.data}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SocketDebugger
