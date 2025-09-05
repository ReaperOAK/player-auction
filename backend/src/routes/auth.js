const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/database');

const router = express.Router();

// Hardcoded team credentials for MVP
const TEAMS = [
  { id: 1, name: 'Team Alpha', username: 'alpha', password: 'alpha123' },
  { id: 2, name: 'Team Beta', username: 'beta', password: 'beta123' },
  { id: 3, name: 'Team Gamma', username: 'gamma', password: 'gamma123' },
  { id: 4, name: 'Team Delta', username: 'delta', password: 'delta123' },
  { id: 5, name: 'Team Echo', username: 'echo', password: 'echo123' },
  { id: 6, name: 'Team Foxtrot', username: 'foxtrot', password: 'foxtrot123' },
  { id: 7, name: 'Team Golf', username: 'golf', password: 'golf123' },
  { id: 8, name: 'Team Hotel', username: 'hotel', password: 'hotel123' },
  { id: 9, name: 'Team India', username: 'india', password: 'india123' },
  { id: 10, name: 'Team Juliet', username: 'juliet', password: 'juliet123' },
  { id: 11, name: 'Team Kilo (Girls)', username: 'kilo', password: 'kilo123' },
  { id: 12, name: 'Team Lima (Girls)', username: 'lima', password: 'lima123' }
];

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: 'admin', username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: { id: 'admin', username, role: 'admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Team login
router.post('/team/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const team = TEAMS.find(t => t.username === username && t.password === password);
    
    if (!team) {
      return res.status(401).json({ error: 'Invalid team credentials' });
    }

    // Check if team exists in database, create if not
    const { data: existingTeam, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingTeam) {
      // Create team in database with initial budget
      const { error: insertError } = await supabase
        .from('teams')
        .insert({
          id: team.id,
          name: team.name,
          budget: 1000000, // 10 lakh initial budget
          slots_left: 11 // 11 players per team
        });

      if (insertError) {
        throw insertError;
      }
    }

    const token = jwt.sign(
      { id: team.id, username: team.username, name: team.name, role: 'team' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { 
        id: team.id, 
        username: team.username, 
        name: team.name, 
        role: 'team' 
      }
    });
  } catch (error) {
    console.error('Team login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all teams (for reference)
router.get('/teams', async (req, res) => {
  try {
    res.json({
      success: true,
      teams: TEAMS.map(({ password, ...team }) => team) // Remove passwords
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

module.exports = router;
