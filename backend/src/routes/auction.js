const express = require('express');
const supabase = require('../config/database');
const { authenticateAdmin, authenticateTeam, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current auction state
router.get('/state', async (req, res) => {
  try {
    const { data: auctionState, error } = await supabase
      .from('auction_state')
      .select(`
        *,
        current_player:players(
          id,
          name,
          year,
          position,
          base_price,
          played_last_year
        )
      `)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no auction state exists, create default one
    if (!auctionState) {
      const { data: newState, error: createError } = await supabase
        .from('auction_state')
        .insert({
          status: 'not_started',
          time_left: 30,
          bid_increment: 10000,
          current_bid: 0
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return res.json({
        success: true,
        auctionState: newState
      });
    }

    res.json({
      success: true,
      auctionState
    });
  } catch (error) {
    console.error('Get auction state error:', error);
    res.status(500).json({ error: 'Failed to fetch auction state' });
  }
});

// Start auction for a player (Admin only)
router.post('/start/:playerId', authenticateAdmin, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { bidIncrement = 10000, timerDuration = 30 } = req.body;

    // Check if player exists and is not sold
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .is('sold_to', null)
      .single();

    if (playerError) {
      throw playerError;
    }

    if (!player) {
      return res.status(400).json({ error: 'Player not found or already sold' });
    }

    // Update auction state
    const { data: auctionState, error: updateError } = await supabase
      .from('auction_state')
      .upsert({
        id: 1, // Single auction state record
        current_player_id: playerId,
        status: 'in_progress',
        time_left: timerDuration,
        bid_increment: bidIncrement,
        current_bid: player.base_price,
        current_bidder: null
      })
      .select(`
        *,
        current_player:players(
          id,
          name,
          year,
          position,
          base_price,
          played_last_year
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Emit socket event (will be handled by socket service)
    req.io?.emit('auction_started', {
      auctionState,
      player
    });

    res.json({
      success: true,
      message: 'Auction started',
      auctionState
    });
  } catch (error) {
    console.error('Start auction error:', error);
    res.status(500).json({ error: 'Failed to start auction' });
  }
});

// Pause auction (Admin only)
router.post('/pause', authenticateAdmin, async (req, res) => {
  try {
    const { data: auctionState, error } = await supabase
      .from('auction_state')
      .update({ status: 'paused' })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      throw error;
    }

    req.io?.emit('auction_paused', { auctionState });

    res.json({
      success: true,
      message: 'Auction paused',
      auctionState
    });
  } catch (error) {
    console.error('Pause auction error:', error);
    res.status(500).json({ error: 'Failed to pause auction' });
  }
});

// Resume auction (Admin only)
router.post('/resume', authenticateAdmin, async (req, res) => {
  try {
    const { data: auctionState, error } = await supabase
      .from('auction_state')
      .update({ status: 'in_progress' })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      throw error;
    }

    req.io?.emit('auction_resumed', { auctionState });

    res.json({
      success: true,
      message: 'Auction resumed',
      auctionState
    });
  } catch (error) {
    console.error('Resume auction error:', error);
    res.status(500).json({ error: 'Failed to resume auction' });
  }
});

// End auction (Admin only)
router.post('/end', authenticateAdmin, async (req, res) => {
  try {
    // Get current auction state
    const { data: currentState, error: stateError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (stateError) {
      throw stateError;
    }

    if (!currentState.current_player_id) {
      return res.status(400).json({ error: 'No active auction to end' });
    }

    // If there's a current bidder, assign player to them
    if (currentState.current_bidder) {
      // Update player with sold info
      const { error: playerError } = await supabase
        .from('players')
        .update({
          sold_to: currentState.current_bidder,
          sold_price: currentState.current_bid
        })
        .eq('id', currentState.current_player_id);

      if (playerError) {
        throw playerError;
      }

      // Update team budget and slots
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('budget, slots_left')
        .eq('id', currentState.current_bidder)
        .single();

      if (teamError) {
        throw teamError;
      }

      const { error: updateTeamError } = await supabase
        .from('teams')
        .update({
          budget: team.budget - currentState.current_bid,
          slots_left: team.slots_left - 1
        })
        .eq('id', currentState.current_bidder);

      if (updateTeamError) {
        throw updateTeamError;
      }
    }

    // Reset auction state
    const { data: auctionState, error: resetError } = await supabase
      .from('auction_state')
      .update({
        current_player_id: null,
        status: 'not_started',
        time_left: 30,
        current_bid: 0,
        current_bidder: null
      })
      .eq('id', 1)
      .select()
      .single();

    if (resetError) {
      throw resetError;
    }

    req.io?.emit('auction_ended', { 
      auctionState,
      soldTo: currentState.current_bidder,
      soldPrice: currentState.current_bid
    });

    res.json({
      success: true,
      message: 'Auction ended',
      auctionState
    });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({ error: 'Failed to end auction' });
  }
});

// Place bid (Team only)
router.post('/bid', authenticateTeam, async (req, res) => {
  try {
    const teamId = req.user.id;
    const { bidAmount } = req.body;

    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }

    // Get current auction state
    const { data: auctionState, error: stateError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (stateError) {
      throw stateError;
    }

    if (auctionState.status !== 'in_progress') {
      return res.status(400).json({ error: 'No active auction' });
    }

    if (bidAmount <= auctionState.current_bid) {
      return res.status(400).json({ error: 'Bid must be higher than current bid' });
    }

    // Check if bid meets increment requirement
    const minimumBid = auctionState.current_bid + auctionState.bid_increment;
    if (bidAmount < minimumBid) {
      return res.status(400).json({ 
        error: `Bid must be at least ₹${minimumBid.toLocaleString()}` 
      });
    }

    // Check team budget
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('budget, slots_left')
      .eq('id', teamId)
      .single();

    if (teamError) {
      throw teamError;
    }

    if (bidAmount > team.budget) {
      return res.status(400).json({ error: 'Insufficient budget' });
    }

    if (team.slots_left <= 0) {
      return res.status(400).json({ error: 'No slots left in team' });
    }

    // Update auction state with new bid
    const { data: updatedState, error: updateError } = await supabase
      .from('auction_state')
      .update({
        current_bid: bidAmount,
        current_bidder: teamId,
        time_left: 30 // Reset timer
      })
      .eq('id', 1)
      .select(`
        *,
        current_player:players(
          id,
          name,
          year,
          position,
          base_price,
          played_last_year
        ),
        bidder_team:teams!current_bidder(
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Emit socket event
    req.io?.emit('new_bid', {
      auctionState: updatedState,
      bidAmount,
      teamId,
      teamName: req.user.name
    });

    res.json({
      success: true,
      message: 'Bid placed successfully',
      auctionState: updatedState
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

// Get auction history
router.get('/history', async (req, res) => {
  try {
    const { data: soldPlayers, error } = await supabase
      .from('players')
      .select(`
        id,
        name,
        year,
        position,
        base_price,
        sold_price,
        played_last_year,
        team:sold_to(
          id,
          name
        )
      `)
      .not('sold_to', 'is', null)
      .order('sold_price', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      soldPlayers: soldPlayers || []
    });
  } catch (error) {
    console.error('Get auction history error:', error);
    res.status(500).json({ error: 'Failed to fetch auction history' });
  }
});

module.exports = router;
