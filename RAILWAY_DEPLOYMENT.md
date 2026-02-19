# Railway Backend Deployment

To deploy your Node.js backend to Railway:

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `attendance-analyzer` repo
4. Railway auto-detects your `server/` folder
5. Get your backend URL (e.g., `https://attendance-analyzer-prod.railway.app`)
6. Update your React API endpoint

## Update React API endpoint:

In your `client/src/api/index.js`, change:
```javascript
const api = axios.create({
  baseURL: 'https://YOUR_RAILWAY_URL/api',  // Add your Railway backend URL
  withCredentials: true,
});
```

Replace `YOUR_RAILWAY_URL` with your actual Railway domain.

Then redeploy on Vercel, and the login should work!

