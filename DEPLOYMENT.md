# Deployment Guide - Make Your App Available Online 24/7

This guide explains how to deploy the Attendance Analyzer app so it's always available online.

---

## **Option 1: Deploy to Render (RECOMMENDED - Easiest)**

### Why Render?
- ✅ Free tier available (app sleeps after 15 mins of inactivity)
- ✅ Paid tier: $7/month for always-on app
- ✅ Simple deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ✅ Environment variables management
- ✅ Automatic deployments on git push

### Steps:

#### 1. **Push your project to GitHub**
```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-analyzer.git
git push -u origin main
```

#### 2. **Create a Render Account**
- Go to https://render.com
- Sign up (free account)
- Connect your GitHub account

#### 3. **Deploy the App**
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Configure:
  - **Name:** `attendance-analyzer`
  - **Environment:** `Node`
  - **Build Command:** `npm run build:client`
  - **Start Command:** `npm start`
  - **Plan:** "Free" (or "Standard" for always-on at $7/month)

#### 4. **Add Environment Variables**
In Render dashboard, go to "Environment" and add:
```
JWT_SECRET=generate-a-random-32-character-string
JWT_REFRESH_SECRET=generate-another-random-32-character-string
ADMIN_EMAILS=your@email.com
REQUIRE_EMAIL_VERIFICATION=false
NODE_ENV=production
```

#### 5. **Update Your Server Config**
Update `server/.env` for production:
```env
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-secret
ADMIN_EMAILS=your@email.com
CLIENT_URL=https://your-app-name.onrender.com
```

**Result:** Your app will be live at `https://your-app-name.onrender.com`

---

## **Option 2: Deploy to Railway.app**

### Why Railway?
- ✅ $5/month credit (free for small projects)
- ✅ Better dashboard than Render
- ✅ Good database support
- ✅ Built-in PostgreSQL support

### Steps:

#### 1. **Create Railway Account**
- Go to https://railway.app
- Sign up with GitHub

#### 2. **Deploy**
- Click "New Project" → "Deploy from GitHub"
- Select your `attendance-analyzer` repo
- Wait for auto-deployment

#### 3. **Add Environment Variables**
- Go to project → "Variables"
- Add the same env vars as above

#### 4. **Configure Port**
- Railway auto-assigns PORT, make sure your `index.js` reads it: ✅ Already configured!

**Result:** Get your Railway domain from the dashboard

---

## **Option 3: Deploy to Heroku (Alternative)**

**Note:** Heroku free tier ended, but paid dynos start at $7/month

### Quick Setup:
```bash
npm install -g heroku
heroku login
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-secret
git push heroku main
```

---

## **Option 4: DigitalOcean App Platform (Production-Ready)**

### Why DigitalOcean?
- ✅ $5-15/month depending on resource
- ✅ Most reliable, production-ready
- ✅ Full control over environment
- ✅ Good documentation

### Steps:

#### 1. **Create DigitalOcean Account**
- Go to https://digitalocean.com
- Sign up

#### 2. **Create App Platform Project**
- Click "Create" → "App"
- Connect GitHub repo
- Choose Node as runtime
- Set build command: `npm run build:client`
- Set run command: `npm start`

#### 3. **Add Database** (optional)
- DigitalOcean → "Managed Databases" → "Create PostgreSQL"
- This replaces SQLite for production

#### 4. **Set Environment**
```
PORT=8080
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
ADMIN_EMAILS=your@email.com
NODE_ENV=production
```

---

## **Keep App Always Running (Avoid Sleep)**

### On Render (Free Plan Issue):
Free tier apps go to sleep after 15 minutes. **Paid solutions:**

**Option A:** Upgrade to "Standard" plan ($7/month) → Always-on
**Option B:** Use a cron job to ping your app every 10 minutes:
- Create a free account on https://cron-job.org
- Set it to GET `https://your-app.onrender.com/api/health` every 5 minutes
- This keeps your app awake (free tier)

### Best Solution: Use Railway or DigitalOcean
Both keep apps running 24/7 for under $7/month

---

## **Database: Local SQLite vs Cloud**

Your app currently uses **SQLite** (local file-based database).

### For Production Deployment:

**Option 1: Keep SQLite (Simple)**
- ✅ Works on Render, Railway, DigitalOcean
- ✅ No additional cost
- ✅ Data persists between restarts
- ⚠️ File stored on server's ephemeral storage (may be lost if server resets)

**Option 2: Move to PostgreSQL (Recommended)**
- ✅ Proper database for production
- ✅ Data guaranteed to persist
- ✅ Better performance, backups, security
- 🔧 Requires code changes
- 💰 Usually $15+/month on all platforms

### Recommendation:
**Start with SQLite on Render/Railway (Free/Cheap)** → If popular, upgrade to PostgreSQL later.

---

## **Post-Deployment Checklist**

After deploying:

- [ ] Visit your live URL and verify it works
- [ ] Test signup/login with real email
- [ ] Test file upload and analysis
- [ ] Test exports (CSV, PDF)
- [ ] Check that admin panel works
- [ ] Set strong JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Update admin email to your real email
- [ ] Test password reset flow (if using SMTP)
- [ ] Monitor logs for errors

---

## **Troubleshooting**

### App won't start?
```bash
# Check server logs on platform dashboard
# Common issues:
1. Missing environment variables
2. PORT not set correctly
3. Build command failed
4. Missing node_modules
```

### CORS errors?
Make sure `CLIENT_URL` matches your deployed frontend URL

### Database errors?
Check that `~/.attendance-analyzer/app.db` has write permissions

### 502 Bad Gateway?
Server crashed → check logs. Usually:
- Missing env variables
- Port conflicts
- Memory issues

---

## **Scaling Later**

Once your app is popular:

1. **Add Redis** for sessions/caching
2. **Switch to PostgreSQL** for better database
3. **Use CDN** (Cloudflare) for static files
4. **Add monitoring** (Sentry, DataDog)
5. **Load balancing** if needed

---

## **Summary: Recommended Path**

1. **Week 1-2:** Deploy to **Render Free** with cron job to prevent sleep
2. **Week 3+:** If users complain about sleep, upgrade to **Render Standard** ($7/month)
3. **Month 2+:** If database issues, switch to **Railway with PostgreSQL** ($15-20/month)

---

**Next Step:** Push your code to GitHub and follow the Render deployment steps above! 🚀

