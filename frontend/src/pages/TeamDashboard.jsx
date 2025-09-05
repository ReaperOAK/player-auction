import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuction } from '../context/AuctionContext'
import { teamsApi } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Trophy,
  Star
} from 'lucide-react'
import { formatCurrency, getPositionColor, getTimerClass } from '../utils/helpers'

const TeamDashboard = () => {
  const { user } = useAuth()
  const { auctionState, placeBid, error, clearError } = useAuction()
  const [teamInfo, setTeamInfo] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState(false)

  useEffect(() => {
    fetchTeamInfo()
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const fetchTeamInfo = async () => {
    try {
      setLoading(true)
      const response = await teamsApi.getMyInfo()
      setTeamInfo(response.data.team)
    } catch (err) {
      toast.error('Failed to fetch team information')
    } finally {
      setLoading(false)
    }
  }

  const handleBidSubmit = async (e) => {
    e.preventDefault()
    
    const bid = parseInt(bidAmount)
    if (!bid || bid <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    if (!auctionState?.current_player_id) {
      toast.error('No active auction')
      return
    }

    if (bid <= auctionState.current_bid) {
      toast.error('Bid must be higher than current bid')
      return
    }

    if (bid > teamInfo.stats.remainingBudget) {
      toast.error('Insufficient budget')
      return
    }

    const minimumBid = auctionState.current_bid + auctionState.bid_increment
    if (bid < minimumBid) {
      toast.error(`Minimum bid is ${formatCurrency(minimumBid)}`)
      return
    }

    setBidding(true)
    try {
      await placeBid(bid)
      toast.success(`Bid placed: ${formatCurrency(bid)}`)
      setBidAmount('')
      fetchTeamInfo() // Refresh team info
    } catch (err) {
      // Error already handled by context
    } finally {
      setBidding(false)
    }
  }

  const handleQuickBid = (amount) => {
    setBidAmount(amount.toString())
  }

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
  const isCurrentBidder = auctionState?.current_bidder === user?.id

  // Quick bid amounts
  const currentBid = auctionState?.current_bid || 0
  const increment = auctionState?.bid_increment || 10000
  const quickBids = [
    currentBid + increment,
    currentBid + increment * 2,
    currentBid + increment * 5,
    currentBid + increment * 10
  ].filter(amount => amount <= teamInfo?.stats?.remainingBudget)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {teamInfo?.name} Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your bids and track your squad
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <DollarSign className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(teamInfo?.stats?.remainingBudget || 0)}
          </div>
          <div className="text-sm text-gray-600">Remaining Budget</div>
        </div>
        
        <div className="card text-center">
          <Users className="mx-auto mb-2 text-blue-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
            {teamInfo?.stats?.playersCount || 0}
          </div>
          <div className="text-sm text-gray-600">Players Bought</div>
        </div>
        
        <div className="card text-center">
          <TrendingUp className="mx-auto mb-2 text-purple-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(teamInfo?.stats?.totalSpent || 0)}
          </div>
          <div className="text-sm text-gray-600">Total Spent</div>
        </div>
        
        <div className="card text-center">
          <Trophy className="mx-auto mb-2 text-yellow-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
            {teamInfo?.stats?.slotsLeft || 0}
          </div>
          <div className="text-sm text-gray-600">Slots Left</div>
        </div>
      </div>

      {/* Current Auction */}
      <AnimatePresence>
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card ${
              isCurrentBidder 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isAuctionActive ? '🔥 Current Auction' : '⏸️ Auction Paused'}
              </h2>
              {isCurrentBidder && (
                <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle size={16} />
                  <span>You're Leading!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Player Info */}
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentPlayer.name}
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <span className={`badge ${getPositionColor(currentPlayer.position)} text-sm px-3 py-1`}>
                      {currentPlayer.position}
                    </span>
                    <span className="text-gray-600">Year {currentPlayer.year}</span>
                    {currentPlayer.played_last_year && (
                      <span className="badge badge-warning">Returning</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Base Price</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(currentPlayer.base_price)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Current Bid</div>
                    <div className="text-xl font-bold text-primary-600">
                      {formatCurrency(auctionState.current_bid)}
                    </div>
                  </div>
                </div>

                {/* Timer */}
                {isAuctionActive && (
                  <div className="text-center mt-6">
                    <div className="text-sm text-gray-600 mb-2">Time Remaining</div>
                    <div className={`text-4xl font-bold ${getTimerClass(timeLeft)}`}>
                      {timeLeft}s
                    </div>
                  </div>
                )}
              </div>

              {/* Bidding Interface */}
              <div>
                {isAuctionActive && teamInfo?.stats?.slotsLeft > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Place Your Bid
                    </h4>

                    {/* Quick Bid Buttons */}
                    {quickBids.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Quick Bids:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {quickBids.map((amount) => (
                            <button
                              key={amount}
                              onClick={() => handleQuickBid(amount)}
                              className="btn btn-secondary btn-sm"
                              disabled={bidding}
                            >
                              {formatCurrency(amount)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Bid Form */}
                    <form onSubmit={handleBidSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Bid Amount
                        </label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Min: ${formatCurrency(currentBid + increment)}`}
                          className="input"
                          min={currentBid + increment}
                          max={teamInfo?.stats?.remainingBudget}
                          step={increment}
                          disabled={bidding}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={bidding || !bidAmount || parseInt(bidAmount) <= currentBid}
                        className="w-full btn-primary btn-lg flex items-center justify-center space-x-2"
                      >
                        {bidding ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <TrendingUp size={16} />
                            <span>Place Bid</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Bid Requirements */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Minimum bid: {formatCurrency(currentBid + increment)}</div>
                      <div>• Your budget: {formatCurrency(teamInfo?.stats?.remainingBudget || 0)}</div>
                      <div>• Bid increment: {formatCurrency(increment)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {!isAuctionActive ? (
                      <div className="text-yellow-600">
                        <Clock size={48} className="mx-auto mb-4" />
                        <div className="font-semibold">Auction Paused</div>
                        <div className="text-sm">Waiting for auction to resume</div>
                      </div>
                    ) : teamInfo?.stats?.slotsLeft === 0 ? (
                      <div className="text-red-600">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <div className="font-semibold">Squad Full</div>
                        <div className="text-sm">You have no remaining slots</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Users size={48} className="mx-auto mb-4" />
                        <div className="font-semibold">No Active Auction</div>
                        <div className="text-sm">Waiting for next player</div>
                      </div>
                    )}
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
          <Users size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Active Auction
          </h3>
          <p className="text-gray-600">
            Waiting for the auctioneer to start the next player auction...
          </p>
        </div>
      )}

      {/* Team Squad */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Trophy className="text-yellow-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Your Squad
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            {teamInfo?.stats?.playersCount || 0} / 11 players
          </div>
        </div>

        {teamInfo?.players && teamInfo.players.length > 0 ? (
          <div className="space-y-3">
            {teamInfo.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`badge ${getPositionColor(player.position)} text-xs`}>
                    {player.position}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      Year {player.year}
                      {player.played_last_year && ' • Returning Player'}
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

            {/* Squad Composition */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Squad Composition</h4>
              <div className="grid grid-cols-5 gap-2 text-sm">
                {Object.entries(teamInfo.stats.playersByPosition).map(([position, count]) => (
                  <div key={position} className="text-center">
                    <div className={`badge ${getPositionColor(position)} text-xs mb-1`}>
                      {position === 'Midfield' ? 'MID' : position === 'Defender' ? 'DEF' : position}
                    </div>
                    <div className="font-semibold text-blue-900">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star size={32} className="mx-auto mb-2 opacity-50" />
            <p>No players in your squad yet</p>
            <p className="text-sm">Start bidding to build your team!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamDashboard
