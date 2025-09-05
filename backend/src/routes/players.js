const express = require('express');
const supabase = require('../config/database');
const { authenticateAdmin, authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const router = express.Router();

// Configure multer for CSV upload
const upload = multer({ dest: 'uploads/' });

// Get all players with optional filtering
router.get('/', async (req, res) => {
  try {
    const { position, sold } = req.query;
    
    let query = supabase.from('players').select(`
      *,
      team:sold_to(id, name)
    `);

    if (position && position !== 'all') {
      query = query.eq('position', position);
    }

    if (sold === 'true') {
      query = query.not('sold_to', 'is', null);
    } else if (sold === 'false') {
      query = query.is('sold_to', null);
    }

    const { data: players, error } = await query.order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      players: players || []
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get single player
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: player, error } = await supabase
      .from('players')
      .select(`
        *,
        team:sold_to(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Upload players via CSV (Admin only)
router.post('/upload', authenticateAdmin, upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const players = [];
    
    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        // Expected CSV format: name,year,position,base_price,played_last_year
        players.push({
          name: row.name?.trim(),
          year: parseInt(row.year),
          position: row.position?.trim(),
          base_price: parseInt(row.base_price) || 50000,
          played_last_year: row.played_last_year?.toLowerCase() === 'true'
        });
      })
      .on('end', async () => {
        try {
          // Validate required fields
          const validPlayers = players.filter(player => 
            player.name && 
            player.year && 
            player.position && 
            ['GK', 'Defender', 'Midfield', 'Striker', 'Girls'].includes(player.position)
          );

          if (validPlayers.length === 0) {
            return res.status(400).json({ error: 'No valid players found in CSV' });
          }

          // Insert players into database
          const { data: insertedPlayers, error: insertError } = await supabase
            .from('players')
            .insert(validPlayers)
            .select();

          if (insertError) {
            throw insertError;
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Successfully uploaded ${insertedPlayers.length} players`,
            players: insertedPlayers
          });
        } catch (error) {
          console.error('CSV processing error:', error);
          fs.unlinkSync(req.file.path);
          res.status(500).json({ error: 'Failed to process CSV' });
        }
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Add single player (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, year, position, base_price, played_last_year } = req.body;

    if (!name || !year || !position) {
      return res.status(400).json({ error: 'Name, year, and position are required' });
    }

    if (!['GK', 'Defender', 'Midfield', 'Striker', 'Girls'].includes(position)) {
      return res.status(400).json({ error: 'Invalid position' });
    }

    const { data: player, error } = await supabase
      .from('players')
      .insert({
        name: name.trim(),
        year: parseInt(year),
        position,
        base_price: parseInt(base_price) || 50000,
        played_last_year: played_last_year || false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Update player (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, position, base_price, played_last_year } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (year) updateData.year = parseInt(year);
    if (position) updateData.position = position;
    if (base_price) updateData.base_price = parseInt(base_price);
    if (played_last_year !== undefined) updateData.played_last_year = played_last_year;

    const { data: player, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete player (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Revert sold player and refund team (Admin only)
router.post('/:id/revert', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // fetch player to ensure it's sold
    const { data: player, error: fetchErr } = await supabase
      .from('players')
      .select('id, sold_price, sold_to')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (!player.sold_to || !player.sold_price) {
      return res.status(400).json({ error: 'Player is not sold' });
    }

    const teamId = player.sold_to;
    const refundAmount = player.sold_price || 0;

  // Refund team: increment budget and slots_left
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, budget, slots_left')
      .eq('id', teamId)
      .single();

    if (teamErr) throw teamErr;

    if (!team) return res.status(404).json({ error: 'Team not found' });

    const newBudget = (team.budget || 0) + refundAmount;
    const newSlots = (team.slots_left || 0) + 1;

    const { error: updateTeamErr } = await supabase
      .from('teams')
      .update({ budget: newBudget, slots_left: newSlots })
      .eq('id', teamId);

    if (updateTeamErr) throw updateTeamErr;

    // Update player to clear sold fields
    const { data: updatedPlayer, error: updatePlayerErr } = await supabase
      .from('players')
      .update({ sold_price: null, sold_to: null })
      .eq('id', id)
      .select()
      .single();

    if (updatePlayerErr) throw updatePlayerErr;
    // Emit realtime event so connected clients can refresh
    try {
      req.io?.emit('player_unsold', {
        playerId: updatedPlayer.id,
        refunded: refundAmount,
        teamId,
        revertedBy: 'admin'
      })
    } catch (emitErr) {
      console.error('Error emitting player_unsold event:', emitErr)
    }

    res.json({ success: true, player: updatedPlayer, refunded: refundAmount, team: { id: teamId, budget: newBudget, slots_left: newSlots } });
  } catch (error) {
    console.error('Revert player error:', error);
    res.status(500).json({ error: 'Failed to revert player' });
  }
});

module.exports = router;
