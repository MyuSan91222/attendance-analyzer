#!/bin/bash
# Quick deployment setup script for Pattern Pilots

echo "Pattern Pilots - Deployment Setup"
echo "==========================================="

# Generate secure random strings for JWT secrets
generate_secret() {
  openssl rand -base64 32
}

echo ""
echo "📝 Generating secure JWT secrets..."
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)

echo ""
echo "Environment variables generated!"
echo ""
echo "Add these to your deployment platform:"
echo "======================================"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "ADMIN_EMAILS=your@email.com"
echo "NODE_ENV=production"
echo ""

# Save to .env for reference (don't commit to git!)
cat > .env.production << EOF
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ADMIN_EMAILS=your@email.com
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-app-name.onrender.com
REQUIRE_EMAIL_VERIFICATION=false
EOF

echo "Saved to .env.production (do not commit to git!)"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub: git push origin main"
echo "2. Go to https://render.com or https://railway.app"
echo "3. Connect your GitHub repo"
echo "4. Add environment variables shown above"
echo "5. Deploy!"
echo ""
echo " Done! Your app will be live in a few minutes."

