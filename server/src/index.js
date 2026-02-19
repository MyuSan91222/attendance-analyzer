import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { getDb, ensureAdminUser } from './db/database.js';
import { verifyAccessToken } from './utils/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../../client/dist');
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize DB on startup and seed admin account
getDb();
ensureAdminUser('adminV11@gmail.com', '912205##');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Serve static files from React build
app.use(express.static(distPath));

// Rate limiting - disabled for development
// In production, use a redis store instead of memory store
// const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } });
// app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Activity log endpoint (for authenticated users)
app.get('/api/activity', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { email } = verifyAccessToken(authHeader.slice(7));
    const logs = getDb().prepare(
      'SELECT * FROM activity_log WHERE user_email = ? ORDER BY created_at DESC LIMIT 50'
    ).all(email);
    res.json({ logs });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));


app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
