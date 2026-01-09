# Deployment Guide

Guide to deploy @LanguageBridgeBot to production.

## Railway.app Deployment (Recommended)

### Prerequisites
- Railway account (free tier available)
- GitHub account
- All environment variables ready

### Steps

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Configure Environment Variables**
   - Go to project settings
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`

4. **Set Webhook URL**
   - Copy Railway deployment URL
   - Update LINE webhook: `https://your-app.railway.app/webhook`

5. **Deploy**
   - Railway auto-deploys on git push
   - Or use Railway CLI: `railway up`

## Docker Deployment

### Build Image
```bash
docker build -t language-bridge-bot .
```

### Run Container
```bash
docker run -d \
  --name language-bridge-bot \
  -p 3000:3000 \
  --env-file .env \
  language-bridge-bot
```

### Docker Compose
```bash
docker-compose up -d
```

## AWS Deployment

### Using Elastic Beanstalk
1. Install EB CLI
2. Initialize: `eb init`
3. Create environment: `eb create`
4. Set environment variables
5. Deploy: `eb deploy`

### Using EC2
1. Launch EC2 instance
2. Install Node.js and dependencies
3. Clone repository
4. Configure environment variables
5. Use PM2 or systemd to run as service

## Environment Configuration

### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
LINE_CHANNEL_ACCESS_TOKEN=<your-token>
LINE_CHANNEL_SECRET=<your-secret>
GOOGLE_TRANSLATE_API_KEY=<your-key>
MONGODB_URI=<your-mongodb-uri>
CACHE_TTL=3600
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## Monitoring Setup

### Health Checks
- Endpoint: `GET /health`
- Railway: Auto-configured
- Custom: Set up monitoring service to ping `/health`

### Logs
- Railway: View in dashboard
- Docker: `docker logs language-bridge-bot`
- PM2: `pm2 logs`

## Backup Strategy

### Database Backups
1. MongoDB Atlas: Automatic backups (paid tier)
2. Manual: Use `scripts/backup-db.sh`
3. Scheduled: Set up cron job for regular backups

### Code Backups
- Use Git for version control
- Regular commits and pushes
- Tag releases

## Scaling

### Horizontal Scaling
- Use load balancer
- Multiple instances
- Shared MongoDB connection

### Vertical Scaling
- Increase instance size
- More CPU/RAM
- Optimize code (see Phase 7)

## Security Checklist

- [ ] Environment variables secured
- [ ] LINE signature validation enabled
- [ ] Rate limiting configured
- [ ] HTTPS enabled (Railway provides)
- [ ] Database access restricted
- [ ] API keys restricted
- [ ] Regular security updates

## Troubleshooting

### Deployment fails
- Check build logs
- Verify all dependencies installed
- Check Node.js version compatibility

### Bot not responding
- Verify webhook URL
- Check environment variables
- Review application logs

### High memory usage
- Enable caching
- Optimize database queries
- Review code for memory leaks
