# AirSense Deployment Guide

## Overview

This guide covers deploying the AirSense air quality monitoring system to production environments. The system consists of a Node.js backend API and a Next.js frontend application.

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│   Port: 3000    │    │   Port: 5000    │    │   File-based    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Local Storage │
│   (Frontend)    │    │   (Backend)     │    │   (Persistent)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Prerequisites

- Node.js 18+ and npm
- OpenWeather API key
- Git repository access
- Domain name (optional)

## Environment Variables

### Backend (.env)
\`\`\`env
# Required
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Database
DB_PATH=./database/air_quality.db

# ML Configuration
MODEL_UPDATE_INTERVAL=3600000
PREDICTION_CONFIDENCE_THRESHOLD=0.7

# Security (Production)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
\`\`\`

### Frontend (.env.local)
\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
NEXT_PUBLIC_APP_NAME=AirSense
NEXT_PUBLIC_APP_VERSION=1.0.0

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
\`\`\`

---

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend Deployment (Vercel)

1. **Prepare the frontend:**
\`\`\`bash
cd frontend
npm install
npm run build
\`\`\`

2. **Deploy to Vercel:**
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repository in Vercel dashboard
\`\`\`

3. **Configure environment variables in Vercel:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add all frontend environment variables

#### Backend Deployment (Railway)

1. **Prepare the backend:**
\`\`\`bash
cd backend
npm install
\`\`\`

2. **Create railway.json:**
\`\`\`json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
\`\`\`

3. **Deploy to Railway:**
\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
\`\`\`

4. **Configure environment variables in Railway:**
- Add all backend environment variables in Railway dashboard

---

### Option 2: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile:**
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
\`\`\`

**Frontend Dockerfile:**
\`\`\`dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
\`\`\`

**Docker Compose:**
\`\`\`yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./data:/app/database
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  data:
\`\`\`

**Deploy with Docker:**
\`\`\`bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

---

### Option 3: VPS Deployment

#### Server Setup (Ubuntu 20.04+)

1. **Install dependencies:**
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
\`\`\`

2. **Clone and setup application:**
\`\`\`bash
# Clone repository
git clone <your-repo-url> /var/www/airsense
cd /var/www/airsense

# Install dependencies
npm run install:all

# Build frontend
cd frontend && npm run build && cd ..

# Set permissions
sudo chown -R $USER:$USER /var/www/airsense
\`\`\`

3. **Configure PM2:**
\`\`\`javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'airsense-backend',
      cwd: '/var/www/airsense/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        OPENWEATHER_API_KEY: 'your_api_key_here',
        FRONTEND_URL: 'https://yourdomain.com'
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/airsense-backend-error.log',
      out_file: '/var/log/pm2/airsense-backend-out.log',
      log_file: '/var/log/pm2/airsense-backend.log'
    },
    {
      name: 'airsense-frontend',
      cwd: '/var/www/airsense/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://yourdomain.com/api'
      },
      instances: 1,
      max_memory_restart: '300M'
    }
  ]
};
\`\`\`

4. **Start with PM2:**
\`\`\`bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
\`\`\`

5. **Configure Nginx:**
\`\`\`nginx
# /etc/nginx/sites-available/airsense
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
\`\`\`

6. **Enable site and SSL:**
\`\`\`bash
# Enable site
sudo ln -s /etc/nginx/sites-available/airsense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

---

## Database Management

### Backup Strategy
\`\`\`bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/airsense"
DB_PATH="/var/www/airsense/backend/database/air_quality.db"

mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup $BACKUP_DIR/air_quality_$DATE.db"

# Compress backup
gzip "$BACKUP_DIR/air_quality_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Database backup completed: air_quality_$DATE.db.gz"
\`\`\`

### Automated Backups
\`\`\`bash
# Add to crontab (crontab -e)
0 2 * * * /var/www/airsense/scripts/backup-db.sh
\`\`\`

---

## Monitoring & Maintenance

### Health Checks
\`\`\`bash
#!/bin/bash
# health-check.sh

API_URL="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is down (HTTP $RESPONSE)"
    # Restart services
    pm2 restart airsense-backend
fi
\`\`\`

### Log Monitoring
\`\`\`bash
# View PM2 logs
pm2 logs

# View specific app logs
pm2 logs airsense-backend

# Monitor system resources
pm2 monit
\`\`\`

### Performance Monitoring
\`\`\`bash
# Check database size
du -sh /var/www/airsense/backend/database/

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "https://yourdomain.com/api/health"

# Monitor memory usage
free -h
\`\`\`

---

## Security Considerations

### Firewall Configuration
\`\`\`bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
\`\`\`

### SSL/TLS Configuration
\`\`\`nginx
# Strong SSL configuration in Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
\`\`\`

### Environment Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor access logs for suspicious activity
- Keep dependencies updated

---

## Troubleshooting

### Common Issues

#### API Key Issues
\`\`\`bash
# Test API key
curl "http://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=YOUR_API_KEY"
\`\`\`

#### Database Issues
\`\`\`bash
# Check database permissions
ls -la backend/database/

# Test database connection
sqlite3 backend/database/air_quality.db ".tables"
\`\`\`

#### Memory Issues
\`\`\`bash
# Check memory usage
free -h
pm2 monit

# Restart services if needed
pm2 restart all
\`\`\`

#### Network Issues
\`\`\`bash
# Test connectivity
curl -I https://yourdomain.com/api/health
netstat -tlnp | grep :5000
\`\`\`

### Performance Optimization

#### Database Optimization
\`\`\`sql
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_air_quality_timestamp ON air_quality_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_air_quality_location ON air_quality_data(location);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
\`\`\`

#### Caching Strategy
\`\`\`javascript
// Add Redis caching for API responses
const redis = require('redis');
const client = redis.createClient();

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
\`\`\`

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancers (Nginx, HAProxy)
- Deploy multiple backend instances
- Implement database clustering
- Use CDN for static assets

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching layers
- Use connection pooling

### Monitoring Tools
- **Application**: PM2, New Relic, DataDog
- **Infrastructure**: Prometheus, Grafana
- **Logs**: ELK Stack, Fluentd
- **Uptime**: Pingdom, UptimeRobot

---

## Support

For deployment support:
- Check logs first: `pm2 logs`
- Verify environment variables
- Test API endpoints manually
- Review Nginx configuration
- Check firewall settings
