import React, { useState, useEffect } from 'react'
import { useAuction } from '../context/AuctionContext'
import { playersApi, teamsApi } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward,
  Upload,
  Filter,
  Settings,
  Users,
  Clock,
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, getPositionColor } from '../utils/helpers'

const AdminDashboard = () => {
  const { 
    auctionState, 
    startAuction, 
    pauseAuction, 
    resumeAuction, 
    endAuction,
  loading: auctionLoading,
  error,
  clearError,
  lastSale
  } = useAuction()

  const [players, setPlayers] = useState([])
  // All players (unfiltered) used for analytics / quick stats
  const [allPlayers, setAllPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterSold, setFilterSold] = useState('false')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [auctionSettings, setAuctionSettings] = useState({
    timerDuration: 30,
    bidIncrement: 10000
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  // Refresh admin data when any player is sold/unsold so stats reflect latest DB state
  useEffect(() => {
    if (!lastSale) return
    // allow DB updates to settle briefly
    const t = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(t)
  }, [lastSale])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch filtered players for the grid and all players for analytics
      const [playersRes, allPlayersRes, teamsRes] = await Promise.all([
        playersApi.getAll({ position: filterPosition, sold: filterSold }),
        playersApi.getAll(),
        teamsApi.getAll()
      ])
      setPlayers(playersRes.data.players)
      setAllPlayers(allPlayersRes.data.players)
      setTeams(teamsRes.data.teams)
    } catch (err) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterPosition, filterSold])

  const handleStartAuction = async (player) => {
    try {
      await startAuction(player.id, auctionSettings)
      toast.success(`Auction started for ${player.name}`)
      setSelectedPlayer(null)
      fetchData()
    } catch (err) {
      // Error handled by context
    }
  }

  const handlePauseAuction = async () => {
    try {
      await pauseAuction()
      toast.success('Auction paused')
    } catch (err) {
      // Error handled by context
    }
  }

  const handleResumeAuction = async () => {
    try {
      await resumeAuction()
      toast.success('Auction resumed')
    } catch (err) {
      // Error handled by context
    }
  }

  const handleEndAuction = async () => {
    try {
      await endAuction()
      toast.success('Auction ended')
      fetchData()
    } catch (err) {
      // Error handled by context
    }
  }

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return
    }

    try {
      await playersApi.delete(playerId)
      toast.success('Player deleted')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete player')
    }
  }

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentPlayer = auctionState?.current_player
  const isAuctionActive = auctionState?.status === 'in_progress'
  const isAuctionPaused = auctionState?.status === 'paused'

  const positions = ['all', 'GK', 'Defender', 'Midfield', 'Striker', 'Girls']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage the auction and players</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Auction Controls */}
      <div className="card bg-gradient-to-r from-blue-50 to-green-50 border-2 border-primary-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🎮 Auction Controls
        </h2>

        {currentPlayer ? (
          <div className="space-y-4">
            {/* Current Player Info */}
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentPlayer.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${getPositionColor(currentPlayer.position)} text-sm`}>
                        {currentPlayer.position}
                      </span>
                      <span className="text-gray-600">Year {currentPlayer.year}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current Bid</div>
                  <div className="text-xl font-bold text-primary-600">
                    {formatCurrency(auctionState.current_bid)}
                  </div>
                  {auctionState.current_bidder && (
                    <div className="text-sm text-green-600">
                      Team {auctionState.current_bidder}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-3">
              {isAuctionActive ? (
                <button
                  onClick={handlePauseAuction}
                  disabled={auctionLoading}
                  className="btn-warning flex items-center space-x-2"
                >
                  <Pause size={16} />
                  <span>Pause Auction</span>
                </button>
              ) : isAuctionPaused ? (
                <button
                  onClick={handleResumeAuction}
                  disabled={auctionLoading}
                  className="btn-success flex items-center space-x-2"
                >
                  <Play size={16} />
                  <span>Resume Auction</span>
                </button>
              ) : null}

              <button
                onClick={handleEndAuction}
                disabled={auctionLoading}
                className="btn-danger flex items-center space-x-2"
              >
                <Square size={16} />
                <span>End Auction</span>
              </button>

              {auctionState.time_left && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock size={16} />
                  <span>{auctionState.time_left}s remaining</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Auction
            </h3>
            <p className="text-gray-600 mb-4">
              Select a player below to start an auction
            </p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="input w-auto"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>
                  {pos === 'all' ? 'All Positions' : pos}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterSold}
            onChange={(e) => setFilterSold(e.target.value)}
            className="input w-auto"
          >
            <option value="false">Available</option>
            <option value="true">Sold</option>
            <option value="">All Players</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => (
          <motion.div
            key={player.id}
            layout
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`badge ${getPositionColor(player.position)} text-xs`}>
                  {player.position}
                </span>
                {player.played_last_year && (
                  <span className="badge badge-warning text-xs">Returning</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {/* TODO: Edit player */}}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">{player.name}</h3>
              <div className="text-sm text-gray-600">Year {player.year}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">Base Price</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(player.base_price)}
              </div>
              {player.sold_price && (
                <div className="text-sm text-green-600">
                  Sold: {formatCurrency(player.sold_price)} to {player.team?.name}
                </div>
              )}
            </div>

            {!player.sold_to && !currentPlayer && (
              <button
                onClick={() => handleStartAuction(player)}
                disabled={auctionLoading}
                className="w-full btn-primary btn-sm flex items-center justify-center space-x-2"
              >
                <Play size={14} />
                <span>Start Auction</span>
              </button>
            )}

            {currentPlayer?.id === player.id && (
              <div className="w-full text-center text-sm text-blue-600 font-medium">
                🔥 Currently on Auction
              </div>
            )}

            {player.sold_to && (
              <div className="w-full text-center text-sm text-green-600 font-medium">
                ✅ Sold to {player.team?.name}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Players Found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or add new players
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Users className="mx-auto mb-2 text-blue-500" size={24} />
            <div className="text-xl font-bold text-gray-900">{allPlayers.length}</div>
          <div className="text-sm text-gray-600">Total Players</div>
        </div>
        
        <div className="card text-center">
          <DollarSign className="mx-auto mb-2 text-green-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
              {allPlayers.filter(p => p.sold_to).length}
          </div>
          <div className="text-sm text-gray-600">Players Sold</div>
        </div>
        
        <div className="card text-center">
          <Clock className="mx-auto mb-2 text-yellow-500" size={24} />
            <div className="text-xl font-bold text-gray-900">
              {allPlayers.filter(p => !p.sold_to).length}
            </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        
        <div className="card text-center">
          <SkipForward className="mx-auto mb-2 text-purple-500" size={24} />
          <div className="text-xl font-bold text-gray-900">
            {teams.length}
          </div>
          <div className="text-sm text-gray-600">Teams</div>
        </div>
      </div>

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        onSuccess={() => {
          fetchData()
          setShowAddPlayer(false)
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={auctionSettings}
        onSave={setAuctionSettings}
      />
    </div>
  )
}

// Add Player Modal Component
const AddPlayerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    position: 'Midfield',
    base_price: 50000,
    played_last_year: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await playersApi.create(formData)
      toast.success('Player added successfully')
      onSuccess()
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        position: 'Midfield',
        base_price: 50000,
        played_last_year: false
      })
    } catch (err) {
      toast.error('Failed to add player')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Player</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              required
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              className="input"
              min={2020}
              max={2030}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="input"
            >
              <option value="GK">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfield">Midfielder</option>
              <option value="Striker">Striker</option>
              <option value="Girls">Girls</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price
            </label>
            <input
              type="number"
              required
              value={formData.base_price}
              onChange={(e) => setFormData({...formData, base_price: parseInt(e.target.value)})}
              className="input"
              min={10000}
              step={10000}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="played_last_year"
              checked={formData.played_last_year}
              onChange={(e) => setFormData({...formData, played_last_year: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="played_last_year" className="text-sm text-gray-700">
              Played last year
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState(settings)

  const handleSave = () => {
    onSave(formData)
    toast.success('Settings saved')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Auction Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timer Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.timerDuration}
              onChange={(e) => setFormData({...formData, timerDuration: parseInt(e.target.value)})}
              className="input"
              min={10}
              max={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bid Increment (₹)
            </label>
            <input
              type="number"
              value={formData.bidIncrement}
              onChange={(e) => setFormData({...formData, bidIncrement: parseInt(e.target.value)})}
              className="input"
              min={1000}
              step={1000}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
