# ⚽ Player Auction System

A real-time web-based player auction platform for football tournaments, similar to IPL-style auctions but optimized for small tournaments with ~12 teams.

## 🚀 Features

- **Real-time bidding** with Socket.IO for instant updates
- **Admin controls** for complete auction management
- **Team participation** with budget tracking and bidding
- **Public viewer dashboard** with live auction watching
- **CSV player import** for bulk data upload
- **Mobile responsive** design for all devices
- **Budget management** with ₹10,00,000 starting budget per team
- **Squad composition** tracking (GK, Defenders, Midfield, Strikers, Girls)
- **Auction history** and analytics
- **Free hosting** compatible (Vercel + Render + Supabase)

## 🛠️ Tech Stack

### Frontend
- **React 19** with functional components and hooks
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **Socket.IO Client** for real-time communication
- **React Router** for navigation
- **Axios** for API calls
- **React Context** for state management

### Backend
- **Node.js** with Express.js server
- **Socket.IO** for real-time events and rooms
- **Supabase** (PostgreSQL) for database
- **JWT** for secure authentication
- **Multer** for CSV file uploads
- **CORS** enabled for cross-origin requests
- **Express middleware** for route protection

### Database
- **PostgreSQL** via Supabase cloud
- **Tables**: Teams, Players, AuctionState
- **Real-time subscriptions** via Socket.IO
- **Data validation** and constraints

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account (free tier available)
- Git for version control

### 1. Clone and Install
```bash
git clone <repository-url>
cd player-auction
npm run install:all
```

### 2. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Copy the SQL script from `backend/database-schema.sql`
3. Run it in your Supabase SQL editor
4. Get your Supabase URL and anon key from project settings

### 3. Environment Configuration

**Backend (.env)**:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=your_jwt_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Development Servers
```bash
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers simultaneously.

## 🎮 Usage

### Access Points
- **Viewer Dashboard**: http://localhost:3000 (no login required)
- **Admin Panel**: Login with `admin / admin123`
- **Team Dashboard**: Login with team credentials

### Default Team Credentials
```
alpha / alpha123    |  beta / beta123     |  gamma / gamma123
delta / delta123    |  echo / echo123     |  foxtrot / foxtrot123
golf / golf123      |  hotel / hotel123   |  india / india123
juliet / juliet123  |  kilo / kilo123     |  lima / lima123
```

### Admin Workflow
1. **Login** as admin with credentials
2. **Upload Players** via CSV or add manually
3. **Start Auction** by selecting a player
4. **Monitor Bidding** and control timer
5. **End Auction** when timer expires or manually
6. **View Analytics** and manage overall tournament

### Team Workflow
1. **Login** with your team credentials
2. **View Current Auction** and player details
3. **Place Bids** within your budget constraints
4. **Track Budget** and squad composition in real-time
5. **Manage Squad** and view purchased players

### Viewer Experience
1. **Visit Public Dashboard** (no login needed)
2. **Watch Live Auctions** with real-time updates
3. **View Leaderboards** and auction history
4. **See Team Statistics** and spending patterns
5. **Mobile Friendly** viewing experience

## 📁 Project Structure

```
player-auction/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── routes/         # API routes (auth, players, teams, auction)
│   │   ├── middleware/     # Authentication middleware
│   │   ├── services/       # Socket.IO handlers
│   │   └── controllers/    # Business logic
│   ├── server.js           # Entry point with Express setup
│   ├── database-schema.sql # Database setup script
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Login, Dashboard)
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and Socket services
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── planning and docs/      # Project documentation
├── package.json           # Root package.json with dev scripts
└── README.md              # This file
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login with credentials
- `POST /api/auth/team/login` - Team login with team credentials
- `GET /api/auth/teams` - Get all teams list

### Players Management
- `GET /api/players` - Get all players (with optional filters)
- `POST /api/players` - Add single player (admin only)
- `POST /api/players/upload` - Upload players via CSV (admin only)
- `PUT /api/players/:id` - Update player details (admin only)
- `DELETE /api/players/:id` - Delete player (admin only)

### Teams Information
- `GET /api/teams` - Get all teams with statistics
- `GET /api/teams/:id` - Get specific team details
- `GET /api/teams/me/info` - Get current authenticated team info
- `GET /api/teams/leaderboard` - Get teams leaderboard

### Auction Controls
- `GET /api/auction/state` - Get current auction state
- `POST /api/auction/start/:playerId` - Start auction for player (admin)
- `POST /api/auction/pause` - Pause current auction (admin)
- `POST /api/auction/resume` - Resume paused auction (admin)
- `POST /api/auction/end` - End current auction (admin)
- `POST /api/auction/bid` - Place bid on current player (team)
- `GET /api/auction/history` - Get complete auction history

## 🌐 Socket.IO Events

### Client to Server Events
- `join_room` - Join appropriate room based on user type (admin/team/viewer)
- `start_timer` - Start auction countdown timer
- `pause_timer` - Pause auction timer
- `resume_timer` - Resume paused timer

### Server to Client Events
- `auction_started` - Auction started for a specific player
- `auction_paused` - Auction has been paused by admin
- `auction_resumed` - Auction has been resumed by admin
- `auction_ended` - Auction ended (timer expired or admin action)
- `new_bid` - New bid placed by a team
- `timer_update` - Real-time timer countdown updates
- `player_sold` - Player sold to winning team
- `player_unsold` - Player not sold (no bids or reserve not met)

## 📝 CSV Upload Format

For bulk player upload, use CSV with these columns:
```csv
name,year,position,base_price,played_last_year
John Smith,2023,GK,100000,true
Mike Johnson,2022,Defender,80000,false
Alex Brown,2023,Midfield,120000,true
Chris Wilson,2021,Striker,150000,true
Sarah Davis,2023,Girls,90000,false
```

**Column Descriptions**:
- `name`: Player full name (required)
- `year`: Academic year or batch (required)
- `position`: One of GK, Defender, Midfield, Striker, Girls (required)
- `base_price`: Starting auction price in currency (optional, defaults to 50000)
- `played_last_year`: Boolean for returning player status (optional, defaults to false)

## 🎯 Key Features in Detail

### Real-time Updates
- All auction events are broadcast instantly via Socket.IO
- Bidding updates appear immediately on all connected clients
- Timer synchronization across all viewers
- Room-based event handling (admin/team/viewer segregation)

### Budget Management
- Each team starts with ₹10,00,000 budget
- Real-time budget validation and tracking
- Bid validation ensures teams don't exceed available budget
- Squad composition tracking and limits

### Auction Controls
- Admin can start/pause/resume auctions at any time
- Configurable bid increments and timer duration
- Automatic player assignment when timer expires
- Manual auction ending capability

### Responsive Design
- Mobile-first design with Tailwind CSS
- Touch-friendly interface for mobile bidding
- Optimized for both portrait and landscape orientations
- Progressive Web App (PWA) capabilities

### Performance Optimized
- React memoization and component optimization
- Efficient Socket.IO event handling with rooms
- Minimal re-renders with optimized state management
- Lazy loading and code splitting

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.render.com
   ```
3. Deploy automatically on push to main branch
4. Custom domain support available

### Backend (Render)
1. Create a new web service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy with auto-deploy enabled
5. Free tier available with limitations

### Database (Supabase)
- Already hosted on Supabase cloud (free tier)
- No additional deployment steps needed
- Automatic backups and scaling
- Real-time database capabilities

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
- ✅ Check if Supabase credentials are correct in .env
- ✅ Ensure PORT is not already in use (try PORT=5001)
- ✅ Verify all environment variables are set
- ✅ Check Node.js version (requires v18+)

**Frontend build errors**:
- ✅ Clear node_modules: `Remove-Item -Recurse -Force node_modules; npm install`
- ✅ Check if VITE_API_URL points to correct backend URL
- ✅ Verify React version compatibility

**Socket.IO connection issues**:
- ✅ Verify CORS settings in backend include frontend URL
- ✅ Check if backend is running and accessible
- ✅ Ensure firewall isn't blocking WebSocket connections
- ✅ Test with browser dev tools Network tab

**Database connection errors**:
- ✅ Verify Supabase URL and anon key are correct
- ✅ Check if database schema has been created properly
- ✅ Ensure RLS policies allow access (or are disabled for development)
- ✅ Test connection with Supabase dashboard

### Development Tips

**Testing Socket.IO**:
- Open multiple browser tabs to simulate different users
- Use browser dev tools to monitor WebSocket connections
- Check Network tab for real-time event traffic
- Test with different user types (admin/team/viewer)

**Debugging API calls**:
- Backend logs all requests in development mode
- Use Postman or similar tool to test API endpoints directly
- Check browser console for frontend API errors
- Verify JWT tokens are being sent correctly

**Performance monitoring**:
- Use React DevTools for component rendering analysis
- Monitor Socket.IO events in browser dev tools
- Check database query performance in Supabase dashboard

## 🤝 Contributing

1. **Fork the project** on GitHub
2. **Create your feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request** with detailed description

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all existing tests pass
- Use meaningful commit messages

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **GitHub Issues**: Open an issue for bugs or feature requests
- **Documentation**: Check this README and code comments
- **Troubleshooting**: Review the troubleshooting section above
- **API Documentation**: Test endpoints with the provided API list

## 🏆 Acknowledgments

- **Socket.IO** for real-time communication
- **Supabase** for database and backend services
- **Vercel** and **Render** for hosting solutions
- **React** and **Vite** for frontend development
- **Tailwind CSS** for styling framework

---

**🚀 Built with ❤️ for football tournament management**

> Ready to revolutionize your tournament auctions? Get started now!
