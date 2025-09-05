import React from 'react'
import { motion } from 'framer-motion'
import { formatCurrency, getPositionColor } from '../utils/helpers'

const PlayerCard = ({ player, onStartAuction, showActions = false, isCurrentAuction = false }) => {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className={`card transition-all duration-200 ${
        isCurrentAuction ? 'border-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      {/* Position Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`badge ${getPositionColor(player.position)} text-xs`}>
          {player.position}
        </span>
        {player.played_last_year && (
          <span className="badge badge-warning text-xs">Returning</span>
        )}
      </div>

      {/* Player Info */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">{player.name}</h3>
        <p className="text-gray-600 text-sm">Year {player.year}</p>
      </div>

      {/* Price Info */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">Base Price</div>
        <div className="font-semibold text-gray-900">
          {formatCurrency(player.base_price)}
        </div>
        
        {player.sold_price && (
          <div className="mt-2">
            <div className="text-sm text-green-600">
              Sold: {formatCurrency(player.sold_price)}
            </div>
            {player.team && (
              <div className="text-sm text-gray-600">
                to {player.team.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && !player.sold_to && onStartAuction && (
        <button
          onClick={() => onStartAuction(player)}
          className="w-full btn-primary btn-sm"
        >
          Start Auction
        </button>
      )}

      {isCurrentAuction && (
        <div className="text-center text-blue-600 font-medium text-sm">
          🔥 Currently on Auction
        </div>
      )}

      {player.sold_to && (
        <div className="text-center text-green-600 font-medium text-sm">
          ✅ Sold
        </div>
      )}
    </motion.div>
  )
}

export default PlayerCard
