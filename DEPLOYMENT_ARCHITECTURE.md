# Deployment Architecture Overview

## Current Setup (Local Only)
```
Your Computer
├── Terminal 1: React Frontend (port 5173)
├── Terminal 2: Node.js Server (port 3001)
└── SQLite Database (local file)

Users: Can only access from your computer
Availability: Only when terminals are running
```

## After Deployment (Online 24/7)
```
Internet/Cloud
│
├── Render Server (or Railway/DigitalOcean)
│   ├── Node.js Express Server (PORT: auto-assigned)
│   ├── React Frontend (built & served by Express)
│   └── SQLite Database (persisted on server)
│
└── Users Anywhere
    ├── Browser on any device
    ├── Auto HTTPS/SSL encryption
    └── Available 24/7
```

---

## What Changed in Your Code

### Before: Local Development
```
User runs locally:
$ cd server && node src/index.js
$ cd client && npm run dev

Browser: http://localhost:5173 (React)
         http://localhost:3001 (API)

Two separate servers, two ports, requires two terminals
```

### After: Single Production Server
```
$ npm run build:client   # Build React
$ npm start              # Run Express server

Express server now:
- Serves React frontend (port 3001)
- Serves API endpoints (port 3001)
- Handles all requests from users
- Listens on all network interfaces (0.0.0.0)
```

---

## Deployment Platforms Compared

### Render.com (Easiest)
```
Your GitHub Repo
    ↓
Render auto-detects Node.js
    ↓
Runs: npm run build:client && npm start
    ↓
Your app at: https://app-name.onrender.com
```
**Free:** Yes (sleeps after 15 min)  
**Paid:** $7/month (always-on)  
**Setup:** 5 minutes

### Railway.app
```
Same as above, but better interface
**Free:** $5 credit monthly
**Paid:** Usually free if usage < $5/month
**Setup:** 5 minutes
```

### DigitalOcean
```
More control, more configuration
**Free:** No
**Paid:** $5/month minimum
**Setup:** 15 minutes
**Best for:** Production apps
```

---

## Your App's Data Flow

### User Signs Up
```
Browser (user's device)
    ↓ (HTTPS encrypted)
Express Server (your deployed app)
    ↓ (checks email)
SQLite Database
    ↓
Response: "Account created, login now"
```

### User Uploads Excel File
```
Browser (user's device)
    ↓ (sends file)
Express Server
    ↓ (parses with SheetJS on client)
Client browser (NO upload to server)
    ↓ (processes data locally)
Response: Results & charts
```

### User Exports as PDF
```
Browser (client-side)
    ↓ (generates PDF locally)
Download to user's device
    ↓
No server processing (all local)
```

---

## Environment Variables Explained

```env
PORT=3001                           # Server port (platform assigns)
NODE_ENV=production                 # Tells Express to optimize
CLIENT_URL=https://app.onrender.com # Frontend URL (for CORS)
JWT_SECRET=very-long-random-string  # Sign access tokens
JWT_REFRESH_SECRET=another-secret   # Sign refresh tokens
ADMIN_EMAILS=your@email.com         # Auto-admin on signup
REQUIRE_EMAIL_VERIFICATION=false    # No email verification needed
```

---

## Database Persistence

### SQLite File Location
```
Production: /app/.attendance-analyzer/app.db (on server)
Local:      ~/.attendance-analyzer/app.db (on your computer)
```

### What Happens When?
```
Server starts
    ↓
getDb() initializes database
    ↓
If database doesn't exist: Create tables
    ↓
If admin user doesn't exist: Create it
    ↓
Server ready to accept requests
```

### Data Persists?
✅ YES - Data survives server restarts  
✅ YES - Data persists between deployments  
⚠️ Note: SQLite files on ephemeral storage (Render/Railway) may be deleted on server resets  
✅ Solution: Use PostgreSQL for production (upgrade later)

---

## Deployment Flow (Render)

### Step 1: GitHub Push
```
$ git add .
$ git commit -m "Deploy"
$ git push origin main
```

### Step 2: Render Detects Change
```
GitHub Webhook → Render
    ↓
Render pulls latest code
```

### Step 3: Build Phase
```
$ npm run build:client    # Builds React to client/dist/
$ npm install             # Installs server dependencies
```

### Step 4: Start Phase
```
$ npm start               # Runs: node server/src/index.js
    ↓
Server starts Express
    ↓
Server initializes SQLite
    ↓
Listens on PORT (auto-assigned, e.g., 10000)
```

### Step 5: Health Check
```
Render pings: https://app-name.onrender.com/api/health
    ↓
Response: { "status": "ok", "timestamp": "..." }
    ↓
✅ Deployment successful!
```

### Step 6: Live!
```
Users can now access: https://app-name.onrender.com
```

---

## Troubleshooting Guide

### Build Fails
```
Error: npm run build:client failed
Solution:
1. Check client/package.json exists
2. Ensure client has build script
3. Check node_modules installed locally
4. Run locally: npm run build:client
```

### Server Crashes on Startup
```
Error: Cannot find module 'express'
Solution:
1. Check server/package.json has all dependencies
2. Ensure package.json files exist
3. Run locally: npm install
```

### App shows blank page
```
Error: React not rendering
Solution:
1. Check client/dist/index.html exists
2. Verify build completed
3. Check browser console for errors
```

### CORS errors
```
Error: Cannot access from browser
Solution:
1. Update CLIENT_URL to correct deployed URL
2. Check origin in server/src/index.js
```

### Database not persisting
```
Error: Data disappeared after restart
Solution:
1. For free tier: Expected, upgrade plan
2. For persistence: Use PostgreSQL (upgrade later)
3. Render free tier: app.db on ephemeral storage
```

---

## Performance & Scaling

### Current Setup
- ✅ Good for 1-100 users
- ✅ SQLite handles 100+ concurrent connections
- ⚠️ No caching
- ⚠️ Excel parsing on client (good for privacy)

### When to Upgrade

**100 users**: Still fine, no changes needed  
**500 users**: Consider CDN for static files  
**1,000+ users**: Switch to PostgreSQL + Redis  
**10,000+ users**: Add load balancing  

---

## Cost Estimate

### Monthly Cost by Users
```
1-10 users:    $0-7/month (free + cron or Standard plan)
10-100 users:  $7-15/month (1-2 Standard plans)
100-1000:      $15-50/month (better hardware + PostgreSQL)
1000+:         $50+/month (load balancing + premium DB)
```

### Breakdown (Render Standard)
```
Always-on server:          $7/month
Optional PostgreSQL addon: $15/month
Total:                     $22/month
```

Much cheaper than traditional hosting! 💰

---

## Security Checklist

- [ ] JWT_SECRET is random, 32+ characters
- [ ] JWT_REFRESH_SECRET is random, 32+ characters
- [ ] ADMIN_EMAILS is set to your email
- [ ] CORS origin matches your domain
- [ ] HTTPS is enforced (platform handles this)
- [ ] No secrets in code (all in environment)
- [ ] Password hashing enabled (bcrypt ✓)
- [ ] Rate limiting enabled on auth routes
- [ ] Helmet.js security headers (✓ configured)

---

## Next Actions

1. **Immediate:**
   - [ ] Read DEPLOY_QUICK_START.md
   - [ ] Push to GitHub
   - [ ] Create Render account

2. **Setup (5 min):**
   - [ ] Connect GitHub to Render
   - [ ] Deploy app
   - [ ] Get live URL

3. **Configure (5 min):**
   - [ ] Add environment variables
   - [ ] Update JWT secrets
   - [ ] Set admin email

4. **Test (10 min):**
   - [ ] Visit live URL
   - [ ] Sign up
   - [ ] Login
   - [ ] Test file upload
   - [ ] Test export

5. **Share (ongoing):**
   - [ ] Send URL to users
   - [ ] Monitor logs
   - [ ] Collect feedback

---

## Success Indicators

✅ Your app is online when:
- You can access it from different device
- Multiple people can login simultaneously  
- Data persists between page refreshes
- File uploads work
- Exports generate correctly
- No errors in platform logs

🎉 **Congratulations! Your app is now available online 24/7!**

