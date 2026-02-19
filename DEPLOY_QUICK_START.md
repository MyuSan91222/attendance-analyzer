# Quick Deployment Guide - Get Your App Online in 10 Minutes

## The Problem
Your app currently only runs locally on your computer. Once you close your terminal, it shuts down.

## The Solution
Deploy to a cloud platform so it runs **24/7 for $0-7/month**.

---

## **FASTEST PATH: Render.com (10 minutes)**

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Ready to deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-analyzer.git
git push -u origin main
```

### Step 2: Sign Up to Render
- Go to https://render.com
- Sign up with GitHub

### Step 3: Deploy
1. Click "New +" → "Web Service"
2. Select your GitHub repo
3. Fill in:
   - **Name:** `attendance-analyzer`
   - **Build Command:** `npm run build:client`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Standard $7/month for always-on)

### Step 4: Add Secrets
In Render Dashboard → Environment, add:
```
JWT_SECRET=your-random-32-char-string
JWT_REFRESH_SECRET=another-random-32-char-string
ADMIN_EMAILS=your@email.com
NODE_ENV=production
```

**Generate random secrets:**
```bash
# Run this in terminal
openssl rand -base64 32  # Copy this
openssl rand -base64 32  # Copy this
```

### Step 5: Done! 🎉
Your app is now live at: `https://your-app-name.onrender.com`

---

## Common Issues

| Issue | Solution |
|-------|----------|
| App "goes to sleep" | Upgrade to Standard plan ($7/month) OR use free cron job to keep awake |
| "Can't connect to backend" | Update `CLIENT_URL` in environment variables |
| Database errors | SQLite works fine; upgrade to PostgreSQL if needed later |
| Build fails | Check logs, ensure all dependencies installed locally |

---

## After Deployment

### Test Your App
1. Visit `https://your-app-name.onrender.com`
2. Sign up with an email
3. Login
4. Upload an Excel file
5. Try exporting

### Share with Others
Send them your Render URL and they can use it anytime!

### Monitor It
- Check logs in Render dashboard
- Get alerts if it crashes
- See how many users access it

---

## Save Money: Free Cron Job for Free Tier

Free Render apps sleep after 15 mins. To keep it awake:

1. Go to https://cron-job.org (free)
2. Create new job
3. Set URL to: `https://your-app-name.onrender.com/api/health`
4. Set interval to every 5 minutes
5. Save

Now your app stays awake **for free!**

---

## Want Always-On? Compare Options:

| Platform | Free Tier | Always-On Cost | Setup Time | Best For |
|----------|-----------|-----------------|------------|----------|
| **Render** | Yes (sleeps) | $7/month | 5 min | Beginners |
| **Railway** | $5 credit | $5/month | 5 min | Developers |
| **DigitalOcean** | No | $5/month | 15 min | Production |
| **Heroku** | No | $7/month | 10 min | Alternatives |

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Sign up to Render/Railway
3. ✅ Connect GitHub repo
4. ✅ Set environment variables
5. ✅ Watch it deploy!
6. ✅ Share your live URL

**Estimated time: 10 minutes**

---

## Need Help?

- Render docs: https://render.com/docs
- Railway docs: https://railway.app/docs
- Check app logs in platform dashboard for errors

**You've got this! 🚀**

