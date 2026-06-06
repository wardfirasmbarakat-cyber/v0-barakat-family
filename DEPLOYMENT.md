# Deployment Guide for v0-barakat-family

## Quick Start

### Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from template
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Run development server
npm run dev
# Visit http://localhost:3000

# 4. Lint code
npm run lint

# 5. Build for production
npm run build

# 6. Test production build
npm start
# Visit http://localhost:3000
```

## Deployment Platforms

### Option 1: Vercel (Recommended for v0 projects)

**Automatic Deployment:**
1. Visit https://vercel.com
2. Click "New Project"
3. Connect your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Deploy with zero configuration

**Environment Variables:**
- Go to Project Settings → Environment Variables
- Add any variables from `.env.example`
- Redeploy to apply changes

**Features Included:**
- ✅ Automatic HTTPS/SSL
- ✅ Edge functions support
- ✅ Analytics (already included)
- ✅ Serverless functions
- ✅ Automatic rollbacks
- ✅ Preview deployments for PRs

### Option 2: Docker Deployment

**Build Image:**
```bash
docker build -t barakat-family:latest .
```

**Run Container:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  barakat-family:latest
```

**Docker Compose (Production):**
```bash
docker-compose up -d
```

### Option 3: Self-Hosted (Node.js/Ubuntu)

```bash
# 1. Clone repository
git clone https://github.com/wardfirasmbarakat-cyber/v0-barakat-family.git
cd v0-barakat-family

# 2. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install dependencies
npm ci

# 4. Build project
npm run build

# 5. Set environment variables
export DATABASE_URL="postgresql://..."

# 6. Start application
npm start

# 7. Use PM2 for process management (optional)
npm install -g pm2
pm2 start npm --name "barakat-family" -- start
pm2 save
```

## Testing Checklist

- [ ] Local dev server runs: `npm run dev`
- [ ] Linting passes: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Production build runs: `npm start`
- [ ] All pages load without errors
- [ ] Database connection works (if applicable)
- [ ] Environment variables are set correctly
- [ ] GitHub Actions CI/CD passes

## Performance Optimization

- ✅ Next.js 16 with automatic code splitting
- ✅ React 19 with concurrent rendering
- ✅ Tailwind CSS with optimized builds
- ✅ Analytics tracking included (@vercel/analytics)

## Monitoring & Logs

**Vercel:**
- Logs: Dashboard → Deployments → Logs
- Monitoring: Analytics tab

**Docker/Self-Hosted:**
```bash
# View logs
docker logs container-name

# Or with PM2
pm2 logs barakat-family
```

## Troubleshooting

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf node_modules .next
npm install
npm run build
```

**Database connection issues:**
- Verify DATABASE_URL in environment variables
- Check network connectivity to database
- Ensure IP whitelisting if using cloud database

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. Deploy to Vercel for quickest setup
2. Configure custom domain
3. Set up monitoring and alerts
4. Configure CI/CD for automated deployments
5. Set up backup strategy for database
