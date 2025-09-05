import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { getTimerClass } from '../utils/helpers'

const AuctionTimer = ({ timeLeft, isActive, onTimeUp }) => {
  React.useEffect(() => {
    if (timeLeft === 0 && isActive && onTimeUp) {
      onTimeUp()
    }
  }, [timeLeft, isActive, onTimeUp])

  if (!isActive) {
    return (
      <div className="text-center text-gray-500">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <div className="text-sm">Auction Paused</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <motion.div
        key={timeLeft}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`text-6xl font-bold ${getTimerClass(timeLeft)}`}
      >
        {timeLeft}
      </motion.div>
      <div className="text-sm text-gray-600 mt-1">seconds remaining</div>
      
      {/* Progress Ring */}
      <div className="relative w-24 h-24 mx-auto mt-4">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - timeLeft / 30)}`}
            className={timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-yellow-500' : 'text-green-500'}
            transition={{ duration: 0.5 }}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Warning indicators */}
      <AnimatePresence>
        {timeLeft <= 5 && timeLeft > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center space-x-2 mt-2 text-red-600"
          >
            <AlertTriangle size={16} className="animate-pulse" />
            <span className="text-sm font-medium">Final seconds!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const AuctionStatus = ({ status, currentBidder, teamName }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: Clock,
          text: 'Live Auction',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'paused':
        return {
          icon: AlertTriangle,
          text: 'Auction Paused',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Auction Completed',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return {
          icon: Info,
          text: 'No Active Auction',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <IconComponent size={16} className={config.color} />
      <span className={`font-medium ${config.color}`}>
        {config.text}
      </span>
      {currentBidder && teamName && (
        <span className="text-sm text-gray-600">
          • Leading: {teamName}
        </span>
      )}
    </div>
  )
}

export default AuctionTimer
