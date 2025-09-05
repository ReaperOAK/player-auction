# Deployment Guide

This guide covers deploying the Player Auction System to free hosting services.

## Overview

- **Frontend**: Deploy to Vercel (free tier)
- **Backend**: Deploy to Render (free tier)
- **Database**: Supabase (free tier)

## Prerequisites

1. GitHub account with the project repository
2. Vercel account
3. Render account  
4. Supabase project setup

## Database Setup (Supabase)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the project URL and anon key

2. **Run Database Schema**:
   - Go to SQL Editor in Supabase dashboard
   - Copy and run the SQL from `backend/database-schema.sql`
   - Verify tables are created: `teams`, `players`, `auction_state`

3. **Configure RLS** (Row Level Security):
   ```sql
   -- Disable RLS for this MVP (enable in production)
   ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
   ALTER TABLE players DISABLE ROW LEVEL SECURITY;
   ALTER TABLE auction_state DISABLE ROW LEVEL SECURITY;
   ```

## Backend Deployment (Render)

1. **Create Web Service**:
   - Go to [render.com](https://render.com)
   - Connect GitHub repository
   - Create "Web Service"
   - Select the repository

2. **Configuration**:
   ```
   Name: player-auction-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_secure_random_string_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_admin_password
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://your-service.onrender.com`)

## Frontend Deployment (Vercel)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import project from GitHub
   - Select the repository

2. **Configuration**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-service.onrender.com
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the frontend URL

5. **Update CORS**:
   - Update the backend `CORS_ORIGIN` environment variable
   - Set it to your Vercel app URL
   - Redeploy the backend

## Custom Domain (Optional)

### Frontend Domain
1. Go to Vercel project settings
2. Add custom domain
3. Configure DNS records

### Backend Domain  
1. Go to Render service settings
2. Add custom domain
3. Configure DNS records
4. Update frontend environment variables

## SSL/HTTPS

Both Vercel and Render provide automatic HTTPS certificates.

## Testing Deployment

1. **Backend Health Check**:
   ```
   GET https://your-backend.onrender.com/health
   ```

2. **Frontend Access**:
   - Open the Vercel URL
   - Test login functionality
   - Test real-time features

3. **Database Connection**:
   - Check if teams and players data loads
   - Test auction state management

## Performance Optimization

### Backend (Render)
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 10-30 seconds
- Consider upgrading for production use

### Frontend (Vercel)  
- Automatic CDN and caching
- Optimized build with tree shaking
- Fast global edge network

### Database (Supabase)
- Free tier: 500MB storage, 2GB transfer
- Connection pooling included
- Real-time subscriptions available

## Monitoring and Logs

### Backend Logs (Render)
- Go to service dashboard
- View logs in real-time
- Monitor performance metrics

### Frontend Analytics (Vercel)
- Built-in analytics available
- Performance monitoring
- Error tracking

### Database Metrics (Supabase)
- Dashboard shows usage stats
- Query performance insights
- Connection monitoring

## Cost Estimates

### Free Tier Limits:
- **Vercel**: Unlimited personal projects, 100GB bandwidth
- **Render**: 750 hours/month (enough for one service)
- **Supabase**: 500MB storage, 2GB bandwidth

### Paid Upgrades:
- **Vercel Pro**: $20/month for teams
- **Render Starter**: $7/month for always-on service
- **Supabase Pro**: $25/month for production features

## Security Considerations

### Production Hardening:
1. **Enable Supabase RLS**:
   ```sql
   ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
   ALTER TABLE players ENABLE ROW LEVEL SECURITY;
   ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;
   ```

2. **Secure Environment Variables**:
   - Use strong JWT secrets
   - Change default admin password
   - Rotate keys regularly

3. **CORS Configuration**:
   - Restrict to specific domains
   - Remove localhost origins

4. **Rate Limiting**:
   - Add rate limiting middleware
   - Protect authentication endpoints

## Backup Strategy

### Database Backups:
- Supabase automatic daily backups (Pro plan)
- Manual export via SQL editor
- Consider external backup solutions

### Code Backups:
- GitHub repository
- Multiple deployment branches
- Tagged releases

## Troubleshooting

### Common Issues:

1. **Backend won't start**:
   - Check environment variables
   - Verify database connection
   - Check build logs

2. **Frontend can't connect**:
   - Verify API URL
   - Check CORS settings
   - Ensure backend is running

3. **Database errors**:
   - Verify Supabase credentials
   - Check table permissions
   - Monitor connection limits

4. **Real-time not working**:
   - Check Socket.IO configuration
   - Verify WebSocket support
   - Check firewall settings

### Debug Steps:
1. Check service health endpoints
2. Review application logs
3. Test API endpoints manually
4. Verify environment variables
5. Check network connectivity

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Render: [render.com/docs](https://render.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
