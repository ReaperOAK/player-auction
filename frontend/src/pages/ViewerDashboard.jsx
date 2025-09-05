import React, { useEffect, useState } from 'react'
import { useAuction } from '../context/AuctionContext'
import { useAuctionHistory, useLeaderboard } from '../hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Trophy, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Star,
  Award
} from 'lucide-react'
import { formatCurrency, getPositionColor, getTimerClass } from '../utils/helpers'
import socketService from '../services/socket'

const ViewerDashboard = () => {
  const { auctionState, lastBid, lastSale, loading } = useAuction()
  const { history, refetch: refetchHistory } = useAuctionHistory()
  const { leaderboard, refetch: refetchLeaderboard } = useLeaderboard()
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    // Connect as viewer if not already connected
    socketService.connect(null)
    
    // Monitor connection status
    socketService.on('connect', () => setConnectionStatus('connected'))
    socketService.on('disconnect', () => setConnectionStatus('disconnected'))
    socketService.on('connect_error', () => setConnectionStatus('error'))

    // Listen for auction events to refresh data
    socketService.on('player_sold', () => {
      refetchHistory()
      refetchLeaderboard()
    })

    return () => {
      socketService.off('connect')
      socketService.off('disconnect') 
      socketService.off('connect_error')
      socketService.off('player_sold')
    }
  }, [refetchHistory, refetchLeaderboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const currentPlayer = auctionState?.current_player
  const isAuctionActive = auctionState?.status === 'in_progress'
  const timeLeft = auctionState?.time_left || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ⚽ Live Player Auction
        </h1>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className={`flex items-center space-x-1 ${
            connectionStatus === 'connected' ? 'text-green-600' : 
            connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="capitalize">{connectionStatus}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{history.length} players sold</span>
        </div>
      </div>

      {/* Current Auction */}
      <AnimatePresence>
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-gradient-to-r from-blue-50 to-green-50 border-2 border-primary-200"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isAuctionActive ? '🔥 Live Auction' : '⏸️ Auction Paused'}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Player Info */}
              <div className="lg:col-span-2">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentPlayer.name}
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <span className={`badge ${getPositionColor(currentPlayer.position)} text-sm px-3 py-1`}>
                      {currentPlayer.position}
                    </span>
                    <span className="text-gray-600">Year {currentPlayer.year}</span>
                    {currentPlayer.played_last_year && (
                      <span className="badge badge-warning">Returning Player</span>
                    )}
                  </div>
                </div>

                {/* Bidding Info */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="card bg-white">
                    <div className="text-sm text-gray-600 mb-1">Base Price</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(currentPlayer.base_price)}
                    </div>
                  </div>
                  <div className="card bg-white">
                    <div className="text-sm text-gray-600 mb-1">Current Bid</div>
                    <div className="text-xl font-bold text-primary-600">
                      {formatCurrency(auctionState.current_bid)}
                    </div>
                  </div>
                </div>

                {/* Current Bidder */}
                {auctionState.current_bidder && (
                  <motion.div
                    key={auctionState.current_bid}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-center mt-4 p-4 bg-green-100 rounded-lg"
                  >
                    <div className="text-sm text-green-700 mb-1">Leading Bid</div>
                    <div className="text-lg font-bold text-green-800">
                      Team {auctionState.current_bidder}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Timer and Status */}
              <div className="flex flex-col items-center justify-center space-y-6">
                {isAuctionActive && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Time Remaining</div>
                    <div className={`text-6xl font-bold ${getTimerClass(timeLeft)}`}>
                      {timeLeft}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">seconds</div>
                    
                    {/* Timer progress bar */}
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-4">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          timeLeft <= 5 ? 'bg-red-500' : 
                          timeLeft <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {!isAuctionActive && auctionState?.status === 'paused' && (
                  <div className="text-center text-yellow-600">
                    <Clock size={48} className="mx-auto mb-2" />
                    <div className="font-semibold">Auction Paused</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Active Auction */}
      {!currentPlayer && (
        <div className="card text-center py-12">
          <Trophy size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Active Auction
          </h3>
          <p className="text-gray-600">
            Waiting for the next player to go on auction...
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {lastBid && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card bg-blue-50 border-blue-200"
        >
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-blue-600" size={24} />
            <div>
              <div className="font-semibold text-blue-900">
                New bid from {lastBid.teamName}
              </div>
              <div className="text-sm text-blue-700">
                {formatCurrency(lastBid.amount)} • Just now
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Last Sale */}
      {lastSale && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-green-50 border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="text-green-600" size={24} />
              <div>
                <div className="font-semibold text-green-900">
                  Player Sold!
                </div>
                <div className="text-sm text-green-700">
                  {lastSale.teamName} • {formatCurrency(lastSale.soldPrice)}
                </div>
              </div>
            </div>
            <div className="text-2xl">🎉</div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Trophy className="text-yellow-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Team Leaderboard
            </h3>
          </div>
          
          <div className="space-y-3">
            {leaderboard.slice(0, 8).map((team, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-600">
                      {team.playersCount} players • {11 - team.playersCount} slots left
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(team.totalSpent)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(team.remainingBudget)} left
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="text-green-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Recent Sales
            </h3>
          </div>
          
          <div className="space-y-3">
            {history.slice(0, 8).map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`badge ${getPositionColor(player.position)} text-xs`}>
                    {player.position}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      Year {player.year} • {player.team?.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(player.sold_price)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Base: {formatCurrency(player.base_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Star size={32} className="mx-auto mb-2 opacity-50" />
              <p>No players sold yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Users className="mx-auto mb-2 text-blue-500" size={24} />
          <div className="text-2xl font-bold text-gray-900">{leaderboard.length}</div>
          <div className="text-sm text-gray-600">Teams</div>
        </div>
        
        <div className="card text-center">
          <Trophy className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-2xl font-bold text-gray-900">{history.length}</div>
          <div className="text-sm text-gray-600">Players Sold</div>
        </div>
        
        <div className="card text-center">
          <DollarSign className="mx-auto mb-2 text-yellow-500" size={24} />
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              history.reduce((sum, player) => sum + (player.sold_price || 0), 0)
            ).replace('₹', '₹')}
          </div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        
        <div className="card text-center">
          <Star className="mx-auto mb-2 text-purple-500" size={24} />
          <div className="text-2xl font-bold text-gray-900">
            {history.length > 0 ? 
              formatCurrency(Math.max(...history.map(p => p.sold_price))).replace('₹', '₹') : 
              '₹0'
            }
          </div>
          <div className="text-sm text-gray-600">Highest Bid</div>
        </div>
      </div>
    </div>
  )
}

export default ViewerDashboard
