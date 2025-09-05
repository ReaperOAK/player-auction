# Player Auction Backend

This is the backend server for the real-time player auction system.

## Features

- RESTful API for auction management
- Real-time communication via Socket.IO
- Supabase PostgreSQL database
- JWT authentication
- CSV player upload
- Admin and team role management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials and other settings.

3. Run the database schema on your Supabase instance using the SQL in `database-schema.sql`

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/team/login` - Team login
- `GET /api/auth/teams` - Get all teams

### Players
- `GET /api/players` - Get all players (with optional filters)
- `GET /api/players/:id` - Get single player
- `POST /api/players` - Add player (admin only)
- `POST /api/players/upload` - Upload players via CSV (admin only)
- `PUT /api/players/:id` - Update player (admin only)
- `DELETE /api/players/:id` - Delete player (admin only)

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team details
- `GET /api/teams/me/info` - Get current team info
- `GET /api/teams/leaderboard` - Get leaderboard

### Auction
- `GET /api/auction/state` - Get current auction state
- `POST /api/auction/start/:playerId` - Start auction (admin only)
- `POST /api/auction/pause` - Pause auction (admin only)
- `POST /api/auction/resume` - Resume auction (admin only)
- `POST /api/auction/end` - End auction (admin only)
- `POST /api/auction/bid` - Place bid (team only)
- `GET /api/auction/history` - Get auction history

## Socket.IO Events

### Client to Server
- `join_room` - Join appropriate room (admin/team/viewer)
- `start_timer` - Start auction timer
- `pause_timer` - Pause auction timer
- `resume_timer` - Resume auction timer

### Server to Client
- `auction_started` - Auction started for a player
- `auction_paused` - Auction paused
- `auction_resumed` - Auction resumed
- `auction_ended` - Auction ended
- `bid_update` - New bid placed
- `timer_update` - Timer countdown update
- `player_sold` - Player sold to team
- `player_unsold` - Player not sold

## Environment Variables

```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:3000
```

## CSV Upload Format

For player upload, use CSV with the following columns:
- `name` - Player name
- `year` - Year (e.g., 2023)
- `position` - One of: GK, Defender, Midfield, Striker, Girls
- `base_price` - Base auction price (optional, defaults to 50000)
- `played_last_year` - true/false (optional, defaults to false)

## Team Credentials

Default team login credentials:
- Username: alpha, Password: alpha123
- Username: beta, Password: beta123
- ... (see auth.js for complete list)

## Deployment

This backend is designed to be deployed on free services like:
- Render
- Railway
- Heroku (free tier discontinued)

Make sure to set all environment variables in your deployment platform.
