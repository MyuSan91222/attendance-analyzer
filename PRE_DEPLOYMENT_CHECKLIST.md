# Pre-Deployment Checklist

## ✅ Code Changes (ALREADY DONE)

- [x] Server configured to serve React frontend
- [x] Static files middleware added
- [x] Server listens on `0.0.0.0` (all interfaces)
- [x] Build scripts updated in package.json
- [x] SPA fallback route configured
- [x] API health check endpoint working

## 📋 Before You Deploy

### 1. **Test Locally First**
```bash
# Build the React app
cd client
npm run build

# Verify build output exists
ls -la dist/

# Test server in production mode
cd ../server
NODE_ENV=production npm start

# Should see: "Server running on port 3001"
# Visit http://localhost:3001 in browser
# Should see the app (not just blank page)
```

Checklist:
- [ ] `client/dist/` folder created
- [ ] `client/dist/index.html` exists
- [ ] Server starts without errors
- [ ] Browser shows app at http://localhost:3001
- [ ] Login page appears
- [ ] Can navigate the app

### 2. **GitHub Setup**
```bash
# Initialize git if not already done
cd /Users/tangbaumyusanaung/Downloads/attendance-analyzer

git init
git add .
git commit -m "Initial commit - production ready"

# Create repo on GitHub
# https://github.com/new
# Name: attendance-analyzer

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-analyzer.git
git push -u origin main
```

Checklist:
- [ ] GitHub account created (https://github.com)
- [ ] New repo created on GitHub
- [ ] Code pushed to GitHub
- [ ] Repo is public (or connect to Render with private)

### 3. **Generate Secure Secrets**
```bash
# Option 1: Use the script I created
bash deploy.sh

# Option 2: Generate manually
openssl rand -base64 32  # Copy output for JWT_SECRET
openssl rand -base64 32  # Copy output for JWT_REFRESH_SECRET
```

Checklist:
- [ ] JWT_SECRET generated (32+ random chars)
- [ ] JWT_REFRESH_SECRET generated (32+ random chars)
- [ ] Secrets saved somewhere safe (NOT in code!)
- [ ] Each is unique

### 4. **Prepare Environment Variables**
```bash
# Keep this list for deployment platform
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_OTHER_SECRET_HERE
ADMIN_EMAILS=your@email.com
NODE_ENV=production
```

Checklist:
- [ ] JWT_SECRET value ready
- [ ] JWT_REFRESH_SECRET value ready
- [ ] Your email for ADMIN_EMAILS
- [ ] NODE_ENV set to "production"

---

## 🚀 Deployment Steps (Choose One)

### **Option A: Render.com (Easiest - Recommended)**

1. Go to https://render.com
2. Click "Sign up" → "Continue with GitHub"
3. Authorize Render to access GitHub
4. Click "New +" → "Web Service"
5. Select your `attendance-analyzer` repo
6. Configure:
   - Name: `attendance-analyzer`
   - Environment: `Node`
   - Build Command: `npm run build:client`
   - Start Command: `npm start`
   - Plan: **Free** (or Standard for $7/month)
7. Click "Advanced" and add environment:
   - Key: `JWT_SECRET` → Value: `YOUR_GENERATED_SECRET`
   - Key: `JWT_REFRESH_SECRET` → Value: `YOUR_OTHER_SECRET`
   - Key: `ADMIN_EMAILS` → Value: `your@email.com`
   - Key: `NODE_ENV` → Value: `production`
8. Click "Create Web Service"
9. Wait 2-3 minutes for deployment
10. Copy your live URL (shows at top: `https://attendance-analyzer-xxx.onrender.com`)

Render Checklist:
- [ ] GitHub authorized
- [ ] Repo connected
- [ ] Build command correct: `npm run build:client`
- [ ] Start command correct: `npm start`
- [ ] All 4 environment variables added
- [ ] Deployment started (watch logs)
- [ ] Live URL visible
- [ ] App responds at live URL

### **Option B: Railway.app (Good Alternative)**

1. Go to https://railway.app
2. Click "Start Project" → "Deploy from GitHub"
3. Select your repo
4. Choose "Node.js" environment
5. Configure variables in project settings
6. Deploy (watches for commits)

Railway Checklist:
- [ ] GitHub authorized
- [ ] Repo selected
- [ ] Environment set to Node.js
- [ ] 4 environment variables added
- [ ] Deployment triggered
- [ ] Live domain assigned

### **Option C: DigitalOcean (Most Control)**

1. Sign up at https://digitalocean.com
2. Create new App
3. Connect GitHub
4. Select repo
5. Configure Node environment
6. Add variables
7. Deploy

DigitalOcean Checklist:
- [ ] Account created
- [ ] GitHub connected
- [ ] Repo selected
- [ ] Environment variables added
- [ ] Build/run commands set
- [ ] Deployed successfully

---

## 🧪 Post-Deployment Testing

Once your app is live:

### Basic Functionality
```
1. Visit https://your-app-name.onrender.com (or your URL)
   - [ ] Page loads (not blank/error)
   - [ ] Login form appears
   - [ ] No console errors (open DevTools)
```

### User Signup
```
2. Click "Sign up" or "Create Account"
   - [ ] Signup form appears
   - [ ] Can enter email and password
   - [ ] Gets redirected to login
   - [ ] Can see login form
```

### Login
```
3. Login with your new account
   - [ ] Enter email and password
   - [ ] Gets redirected to dashboard
   - [ ] Dashboard loads without errors
```

### Core Features
```
4. Upload Excel file
   - [ ] Drag & drop works
   - [ ] File accepted
   - [ ] Analysis completes
   - [ ] Results display with charts

5. Export Data
   - [ ] Can export as CSV
   - [ ] Can export as TXT
   - [ ] Can export as PDF
   - [ ] Files download correctly

6. Navigate
   - [ ] Can switch between pages
   - [ ] Navbar buttons work
   - [ ] No errors in console
```

### Admin Features (if applicable)
```
7. Admin Panel (/admin)
   - [ ] Can access if admin
   - [ ] Lists users
   - [ ] Can see activity log
```

Testing Checklist:
- [ ] App loads without blank page
- [ ] Can signup
- [ ] Can login
- [ ] Can upload Excel
- [ ] Can analyze
- [ ] Can export (CSV, TXT, PDF)
- [ ] No console errors
- [ ] Works on mobile browser

---

## 🛠️ If Deployment Fails

### Check the Logs
1. Go to platform dashboard
2. Look for "Logs" or "Deploy logs"
3. Find the error message
4. Common issues:

| Error | Solution |
|-------|----------|
| `npm: command not found` | Node.js not installed (platform issue) |
| `Cannot find module 'express'` | Dependencies not installed; check `npm install` works locally |
| `Build failed` | Run `npm run build:client` locally to see actual error |
| `Port already in use` | Platform auto-assigns PORT; ensure code uses env variable |
| `Cannot find file 'index.html'` | React build didn't create dist folder |

### Debug Steps
1. **Verify locally first:**
   ```bash
   npm run build:client  # Should create client/dist/
   npm start             # Should run without error
   ```

2. **Check package.json files:**
   - Both `package.json` files exist?
   - Both have correct scripts?
   - All dependencies listed?

3. **Check code:**
   - `server/src/index.js` correct?
   - Using `process.env.PORT`?
   - Path imports working?

4. **Push fix and redeploy:**
   ```bash
   git add .
   git commit -m "Fix: [what you fixed]"
   git push origin main
   # Platform auto-redeploys
   ```

Debugging Checklist:
- [ ] Checked platform logs
- [ ] Identified error message
- [ ] Tested locally
- [ ] Fixed code
- [ ] Re-committed and pushed
- [ ] Watched new deployment

---

## 📊 Ongoing Maintenance

### Weekly
- [ ] Check for errors in logs
- [ ] Verify app is still running
- [ ] Test with real usage

### Monthly
- [ ] Check database size
- [ ] Monitor user feedback
- [ ] Review security settings

### As Needed
- [ ] Update dependencies for security
- [ ] Add new features
- [ ] Optimize performance

---

## 🎉 Success Criteria

You'll know deployment was successful when:

✅ **App is accessible** from any device at live URL  
✅ **Multiple users can login** simultaneously  
✅ **Data persists** between refreshes and restarts  
✅ **File uploads work** from browser  
✅ **Exports generate** correctly  
✅ **No errors in logs** on platform dashboard  
✅ **Load time is reasonable** (<3 seconds)  
✅ **Responsive on mobile** browsers  

---

## 📝 Keep This Information Safe

Save these details somewhere secure:
- [ ] GitHub repo URL
- [ ] Live app URL
- [ ] JWT_SECRET (keep private!)
- [ ] JWT_REFRESH_SECRET (keep private!)
- [ ] Admin email used
- [ ] Deployment platform login

---

## 🚨 Common Gotchas

1. **Don't commit secrets to GitHub**
   - Use environment variables on platform
   - Keep `.env` in `.gitignore`

2. **Don't use `http://localhost`**
   - Use relative URLs or deployed domain
   - Update `CLIENT_URL` for production

3. **Don't forget SQLite location**
   - SQLite works; all data persists
   - Backup data if important (upgrade to PostgreSQL later)

4. **Don't restart locally after deploying**
   - Once live, changes require `git push`
   - Don't manually restart the server

---

## 📞 Need Help?

Check these in order:
1. **Platform docs** (Render/Railway docs)
2. **Platform support chat** (live help)
3. **This guide** (troubleshooting section)
4. **Stack Overflow** (search error message)

---

## Summary

### What Changed
- ✅ Server now serves React frontend + API from single port
- ✅ Build scripts ready for cloud platforms
- ✅ Environment variables configurable
- ✅ Deployment configs provided

### What to Do
1. Test locally: `npm run build:client && npm start`
2. Push to GitHub
3. Deploy on Render/Railway/DigitalOcean
4. Add environment variables
5. Test live app
6. Share URL with users

### Time Required
- Setup: 15 minutes
- Deployment: 5-10 minutes (waiting for build)
- Testing: 10 minutes
- **Total: ~30-40 minutes to go live!**

---

**Ready to deploy?** Start with Option A: Render.com 🚀

For detailed guide, read: `DEPLOY_QUICK_START.md`

