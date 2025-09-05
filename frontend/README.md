# Player Auction Frontend

This is the frontend application for the real-time player auction system built with React, Vite, and Tailwind CSS.

## Features

- **Real-time Updates**: Live auction updates via Socket.IO
- **Three User Interfaces**:
  - Public viewer dashboard
  - Team bidding interface
  - Admin control panel
- **Responsive Design**: Works on desktop and mobile
- **Interactive Animations**: Smooth transitions and effects
- **Live Notifications**: Toast notifications for actions

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Router DOM** - Routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your backend URL.

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuctionTimer.jsx
│   ├── Navbar.jsx
│   ├── PlayerCard.jsx
│   ├── ProtectedRoute.jsx
│   └── TeamCard.jsx
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   └── AuctionContext.jsx
├── hooks/              # Custom React hooks
│   └── index.js
├── pages/              # Main page components
│   ├── AdminDashboard.jsx
│   ├── LoginPage.jsx
│   ├── TeamDashboard.jsx
│   └── ViewerDashboard.jsx
├── services/           # API and external services
│   ├── api.js
│   └── socket.js
├── utils/              # Utility functions
│   └── helpers.js
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## User Interfaces

### Viewer Dashboard (`/watch`)
- Public access, no login required
- Live auction viewing
- Team leaderboard
- Player sales history
- Real-time bid updates

### Team Dashboard (`/team`)
- Team login required
- Place bids on current auction
- View team budget and squad
- Quick bid buttons
- Squad composition tracking

### Admin Dashboard (`/admin`)
- Admin login required
- Start/pause/resume/end auctions
- Player management (add/edit/delete)
- Auction settings configuration
- Real-time auction control

## Authentication

### Hardcoded Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**Team Login Examples:**
- Username: `alpha`, Password: `alpha123`
- Username: `beta`, Password: `beta123`
- Username: `gamma`, Password: `gamma123`
- ... (see backend documentation for complete list)

## Real-time Features

The application uses Socket.IO for real-time communication:

- **Auction Events**: Start, pause, resume, end
- **Bid Updates**: Live bid updates with animations
- **Timer Sync**: Synchronized countdown timer
- **Player Sales**: Instant notifications when players are sold
- **Connection Status**: Real-time connection monitoring

## Styling and Theming

The application uses Tailwind CSS with custom component classes:

- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-success`, etc.
- **Cards**: `.card` for consistent container styling
- **Badges**: Position and status indicators
- **Animations**: Custom CSS animations for auctions

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
The application is configured for easy deployment to Vercel:

1. Connect your repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```
VITE_API_URL=https://your-backend-url.com
```

## Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: Responsive image loading
- **Efficient Re-renders**: Optimized React context usage
- **Connection Management**: Automatic socket reconnection

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development Tips

1. **Hot Reload**: Changes auto-refresh in development
2. **Error Boundaries**: Comprehensive error handling
3. **TypeScript Ready**: Easy migration to TypeScript
4. **ESLint/Prettier**: Code formatting and linting setup
5. **Mobile First**: Responsive design approach

## API Integration

The frontend integrates with the backend API for:

- **Authentication**: Login endpoints
- **Player Management**: CRUD operations
- **Team Data**: Budget and squad information
- **Auction Control**: Start, pause, resume, end auctions
- **Real-time Events**: Socket.IO event handling

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check if backend is running
2. **Authentication Issues**: Verify credentials and tokens
3. **Real-time Not Working**: Check Socket.IO connection
4. **Styling Issues**: Verify Tailwind CSS is properly loaded

### Debug Mode

Set `NODE_ENV=development` to enable debug logging and error details.

## Contributing

1. Follow React best practices
2. Use TypeScript for new components (optional)
3. Add proper error handling
4. Test on multiple devices and browsers
5. Update documentation for new features
