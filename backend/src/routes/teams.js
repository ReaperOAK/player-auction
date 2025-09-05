const express = require('express');
const supabase = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all teams with their stats
router.get('/', async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        players:players(count)
      `)
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      teams: teams || []
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get single team with detailed info
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError) {
      throw teamError;
    }

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get team's players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('sold_to', id)
      .order('name');

    if (playersError) {
      throw playersError;
    }

    // Calculate stats
    const totalSpent = players.reduce((sum, player) => sum + (player.sold_price || 0), 0);
    const playersByPosition = {
      GK: players.filter(p => p.position === 'GK').length,
      Defender: players.filter(p => p.position === 'Defender').length,
      Midfield: players.filter(p => p.position === 'Midfield').length,
      Striker: players.filter(p => p.position === 'Striker').length,
      Girls: players.filter(p => p.position === 'Girls').length
    };

    res.json({
      success: true,
      team: {
        ...team,
        players,
        stats: {
          totalSpent,
          playersCount: players.length,
          playersByPosition,
          remainingBudget: team.budget - totalSpent,
          slotsLeft: team.slots_left
        }
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get current user's team info
router.get('/me/info', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'team') {
      return res.status(403).json({ error: 'Team access required' });
    }

    const teamId = req.user.id;
    
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) {
      throw teamError;
    }

    // Get team's players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('sold_to', teamId)
      .order('name');

    if (playersError) {
      throw playersError;
    }

    // Calculate stats
    const totalSpent = players.reduce((sum, player) => sum + (player.sold_price || 0), 0);
    const playersByPosition = {
      GK: players.filter(p => p.position === 'GK').length,
      Defender: players.filter(p => p.position === 'Defender').length,
      Midfield: players.filter(p => p.position === 'Midfield').length,
      Striker: players.filter(p => p.position === 'Striker').length,
      Girls: players.filter(p => p.position === 'Girls').length
    };

    res.json({
      success: true,
      team: {
        ...team,
        players,
        stats: {
          totalSpent,
          playersCount: players.length,
          playersByPosition,
          remainingBudget: team.budget - totalSpent,
          slotsLeft: team.slots_left
        }
      }
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ error: 'Failed to fetch team info' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        budget
      `)
      .order('name');

    if (error) {
      throw error;
    }

    // Get player counts and spending for each team
    const leaderboard = await Promise.all(
      teams.map(async (team) => {
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('sold_price')
          .eq('sold_to', team.id);

        if (playersError) {
          throw playersError;
        }

        const totalSpent = players.reduce((sum, player) => sum + (player.sold_price || 0), 0);
        const playersCount = players.length;
        const remainingBudget = team.budget - totalSpent;

        return {
          ...team,
          totalSpent,
          playersCount,
          remainingBudget,
          slotsLeft: 11 - playersCount // Assuming 11 players per team
        };
      })
    );

    // Sort by total spent (descending)
    leaderboard.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
