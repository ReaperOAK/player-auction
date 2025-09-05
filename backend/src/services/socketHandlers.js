const supabase = require('../config/database');

let auctionTimer = null;
let ioInstance = null; // Store io instance for external access
let isStopping = false;

// Helper to start the server-side timer (shared by start and resume)
const startServerTimer = async (duration, io = ioInstance) => {
  // If there's already a running timer, stop it first to avoid duplicates
  if (auctionTimer) {
    isStopping = true;
    clearTimeout(auctionTimer);
    auctionTimer = null;
    isStopping = false;
  }

  let timeLeft = typeof duration === 'number' ? duration : 30;

  // Mark auction as in_progress in DB (best-effort)
  try {
    await supabase
      .from('auction_state')
      .update({ status: 'in_progress', time_left: timeLeft })
      .eq('id', 1);
  } catch (err) {
    console.error('Failed to update auction state when starting timer:', err);
  }

  // Emit initial timer value immediately
  console.log(`⏰ Starting timer with ${timeLeft} seconds, broadcasting initial timer_update`);
  io?.emit('timer_update', { timeLeft });

  // Use recursive setTimeout to ensure each tick waits for async work to finish
  const tick = async () => {
    // If stop requested, do not schedule next tick
    if (isStopping) return;

    // Decrement
    timeLeft = Math.max(0, timeLeft - 1);

    try {
      // Atomically update DB time_left and fetch current state for broadcasting
      const { data: updatedState, error } = await supabase
        .from('auction_state')
        .update({ time_left: timeLeft })
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        console.error('Error updating timer in DB:', error);
      } else {
        // Broadcast time update
        io?.emit('timer_update', { timeLeft: timeLeft });
      }
    } catch (err) {
      console.error('Error during timer tick DB update:', err);
    }

    // If time reaches 0, perform auto-end logic and do not schedule another tick
    if (timeLeft <= 0) {
      auctionTimer = null;

      try {
        const { data: currentState } = await supabase
          .from('auction_state')
          .select('*')
          .eq('id', 1)
          .single();

  if (currentState && currentState.current_bidder) {
          // Assign player to highest bidder
          await supabase
            .from('players')
            .update({
              sold_to: currentState.current_bidder,
              sold_price: currentState.current_bid
            })
            .eq('id', currentState.current_player_id);

          // Update team budget and slots
          const { data: team } = await supabase
            .from('teams')
            .select('budget, slots_left')
            .eq('id', currentState.current_bidder)
            .single();

          await supabase
            .from('teams')
            .update({
              budget: team.budget - currentState.current_bid,
              slots_left: team.slots_left - 1
            })
            .eq('id', currentState.current_bidder);

          // Get team name for broadcast
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', currentState.current_bidder)
            .single();

          io?.emit('player_sold', {
            playerId: currentState.current_player_id,
            teamId: currentState.current_bidder,
            teamName: teamData?.name,
            soldPrice: Number(currentState.current_bid) || 0
          });
        } else {
          io?.emit('player_unsold', {
            playerId: currentState.current_player_id
          });
        }

        // Reset auction state
        await supabase
          .from('auction_state')
          .update({
            current_player_id: null,
            status: 'not_started',
            time_left: 30,
            current_bid: 0,
            current_bidder: null
          })
          .eq('id', 1);

        // Fetch the reset auction state to broadcast consistent state to clients
        try {
          const { data: resetState } = await supabase
            .from('auction_state')
            .select(`*
            , current_player:players(
                id,
                name,
                year,
                position,
                base_price,
                played_last_year
              )
            `)
            .eq('id', 1)
            .single();

          io?.emit('auction_auto_ended', { auctionState: resetState });
          io?.emit('auction_state_update', { auctionState: resetState });
        } catch (err) {
          // Fall back to simple signal if fetching reset state fails
          io?.emit('auction_auto_ended');
        }
      } catch (error) {
        console.error('Auto-end auction error:', error);
      }

      return;
    }

    // Schedule next tick after ~1s
    auctionTimer = setTimeout(tick, 1000);
  };

  // Start first scheduled tick
  auctionTimer = setTimeout(tick, 1000);
};

const socketHandlers = (io) => {
  ioInstance = io; // Store for external access
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room based on user role
    socket.on('join_room', (data) => {
      const { role, teamId } = data;
      
      if (role === 'admin') {
        socket.join('admin');
        console.log(`👑 Admin joined: ${socket.id}`);
      } else if (role === 'team') {
        socket.join('teams');
        socket.join(`team_${teamId}`);
        console.log(`🏆 Team ${teamId} joined: ${socket.id}`);
      } else {
        // Handle both 'viewer' and undefined/null cases
        socket.join('viewers');
        console.log(`👁️ Viewer joined: ${socket.id}`);
      }

      // Send current auction state to newly connected client
      sendCurrentState(socket);
    });

    // Function to send current auction state
    const sendCurrentState = async (targetSocket) => {
      try {
        const { data: auctionState } = await supabase
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
          .eq('id', 1)
          .single();

        if (auctionState) {
          targetSocket.emit('auction_state_update', { auctionState });
        }
      } catch (error) {
        console.error('Error sending current state:', error);
      }
    };

    // Handle auction timer events
    socket.on('start_timer', async (data) => {
      const { duration = 30 } = data;
      startServerTimer(duration, io);
    });

    socket.on('pause_timer', async () => {
      if (auctionTimer) {
        clearInterval(auctionTimer);
        auctionTimer = null;

        // Mark auction as paused in DB (best-effort) and notify clients
        try {
          const { data: pausedState } = await supabase
            .from('auction_state')
            .update({ status: 'paused' })
            .eq('id', 1)
            .select()
            .single();

          io.emit('timer_paused');
          io.emit('auction_paused', { auctionState: pausedState });
          io.emit('auction_state_update', { auctionState: pausedState });
        } catch (err) {
          console.error('Error pausing timer and updating DB:', err);
          io.emit('timer_paused');
        }
      }
    });

    socket.on('resume_timer', async () => {
      if (!auctionTimer) {
        try {
          const { data: currentState } = await supabase
            .from('auction_state')
            .select('time_left')
            .eq('id', 1)
            .single();

          if (currentState && currentState.time_left > 0) {
            // Start timer on server-side
            startServerTimer(currentState.time_left, io);

            // Notify clients that auction has resumed
            io.emit('auction_resumed', { auctionState: currentState });
            io.emit('auction_state_update', { auctionState: currentState });
          }
        } catch (err) {
          console.error('Error resuming timer:', err);
        }
      }
    });

  // NOTE: clients should place bids via REST API `/api/auction/bid`.
  // The backend route will validate, update DB, and emit `bid_update` and `auction_state_update`.

    // Handle admin controls - broadcast to teams and viewers
    socket.on('admin_action', (data) => {
      io.to('teams').to('viewers').emit('admin_update', data);
    });

    // Handle auction state changes - broadcast to all
    socket.on('auction_state_changed', (data) => {
      io.emit('auction_state_update', data);
    });

    // Handle chat messages (future feature)
    socket.on('chat_message', (data) => {
      io.to('viewers').emit('new_chat_message', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Cleanup on server shutdown
  process.on('SIGINT', () => {
    if (auctionTimer) {
      isStopping = true;
      clearTimeout(auctionTimer);
      auctionTimer = null;
    }
  });
};

// Export the timer function for use in REST routes
module.exports = { 
  default: socketHandlers,
  startAuctionTimer: startServerTimer,
  stopAuctionTimer: () => {
    if (auctionTimer) {
      isStopping = true;
      clearTimeout(auctionTimer);
      auctionTimer = null;
      isStopping = false;
      console.log('🛑 Auction timer stopped by external call');
    }
  }
};
