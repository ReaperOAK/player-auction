import React from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/helpers'
import { Trophy, TrendingUp, Users } from 'lucide-react'

const TeamCard = ({ team, rank, showRank = true }) => {
  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white'
    if (rank === 2) return 'bg-gray-400 text-white'
    if (rank === 3) return 'bg-orange-500 text-white'
    return 'bg-gray-200 text-gray-700'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="card hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showRank && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(rank)}`}>
              {rank}
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-gray-900">{team.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{team.playersCount || 0} players</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp size={12} />
                <span>{formatCurrency(team.totalSpent || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(team.remainingBudget || team.budget || 0)}
          </div>
          <div className="text-sm text-gray-600">remaining</div>
        </div>
      </div>

      {/* Progress bar for budget used */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Budget Used</span>
          <span>
            {team.totalSpent && team.budget 
              ? Math.round((team.totalSpent / team.budget) * 100)
              : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${team.totalSpent && team.budget 
                ? Math.min((team.totalSpent / team.budget) * 100, 100)
                : 0}%` 
            }}
          ></div>
        </div>
      </div>
    </motion.div>
  )
}

export default TeamCard
