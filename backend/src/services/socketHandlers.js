const supabase = require('../config/database');

let auctionTimer = null;

const socketHandlers = (io) => {
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
      
      if (auctionTimer) {
        clearInterval(auctionTimer);
      }

      let timeLeft = duration;
      
      auctionTimer = setInterval(async () => {
        timeLeft--;
        
        // Update time in database
        await supabase
          .from('auction_state')
          .update({ time_left: timeLeft })
          .eq('id', 1);

        // Broadcast time update
        io.emit('timer_update', { timeLeft });

        // If time reaches 0, end auction
        if (timeLeft <= 0) {
          clearInterval(auctionTimer);
          auctionTimer = null;
          
          // Auto-end auction
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

              io.emit('player_sold', {
                playerId: currentState.current_player_id,
                teamId: currentState.current_bidder,
                teamName: teamData?.name,
                soldPrice: currentState.current_bid
              });
            } else {
              io.emit('player_unsold', {
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

            io.emit('auction_auto_ended');
            
          } catch (error) {
            console.error('Auto-end auction error:', error);
          }
        }
      }, 1000);
    });

    socket.on('pause_timer', () => {
      if (auctionTimer) {
        clearInterval(auctionTimer);
        auctionTimer = null;
        io.emit('timer_paused');
      }
    });

    socket.on('resume_timer', async () => {
      if (!auctionTimer) {
        const { data: currentState } = await supabase
          .from('auction_state')
          .select('time_left')
          .eq('id', 1)
          .single();

        if (currentState && currentState.time_left > 0) {
          socket.emit('start_timer', { duration: currentState.time_left });
        }
      }
    });

    // Handle real-time bid updates - broadcast to all rooms
    socket.on('bid_placed', (data) => {
      // Broadcast to all connected clients
      io.emit('bid_update', data);
    });

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
      clearInterval(auctionTimer);
    }
  });
};

module.exports = socketHandlers;
