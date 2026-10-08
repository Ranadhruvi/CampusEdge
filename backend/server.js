const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db'); 
const { JWT_SECRET, authenticateToken, requireAdmin, optionalAuth, rateLimiter } = require('./middleware/authMiddleware');

const authRoutes = require('./authRoutes');
const questionRoutes = require('./questionRoutes');
const resumeRoutes = require('./resumeRoutes'); 
const userRoutes = require('./userRoutes'); 
const codeRoutes = require('./codeRoutes');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration with strict file extensions and 10MB size limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: PDF, PNG, JPG, JPEG, WEBP.'));
    }
  }
});

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Security Headers Middleware (Protection against clickjacking, MIME sniffing, XSS)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Dynamic Environment-Driven CORS Middleware
const rawOrigins = process.env.CLIENT_URL || process.env.FRONTEND_URL || '';
const configuredOrigins = rawOrigins
  ? rawOrigins.split(',').map(s => s.trim().replace(/\/$/, '')) 
  : [];
const defaultLocalOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000', 
  'http://127.0.0.1:5000'
];
const allowedOrigins = [...new Set([...configuredOrigins, ...defaultLocalOrigins])];

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

// Universal permissive preflight & CORS header injector
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  const reqHeaders = req.headers['access-control-request-headers'];
  if (reqHeaders) {
    res.setHeader('Access-Control-Allow-Headers', reqHeaders);
  } else {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, x-admin-key, x-admin-passphrase, adminSecretKey');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));


// Root ping & Health Check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'CampusEdge Backend API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(200).json({ status: 'degraded', database: 'disconnected', error: err.message });
  }
});


app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(uploadDir));
app.use(passport.initialize());

// Mount API Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);
app.use('/api', questionRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/users', userRoutes);

// Configure Nodemailer Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper for parsing Gemini responses safely
function cleanAndParseAIJson(rawText, fallback = {}) {
  try {
    if (!rawText) return fallback;
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      cleaned = match[0];
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI JSON Parse Warning:", err.message);
    return fallback;
  }
}


// ==========================================
// REAL-TIME STUDENT STREAK & GAMIFICATION API
// ==========================================

const { seed: seedQuestionBank } = require('./scripts/seedQuestions');

// Comprehensive database initialization and self-healing schema execution
(async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('✅ Core database schema (users, circulars, questions, test_history) verified and ready.');
    }

    // Proctoring and streak table updates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_streaks (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        current_streak INT DEFAULT 1,
        longest_streak INT DEFAULT 1,
        last_active_date VARCHAR(50),
        total_xp INT DEFAULT 100,
        coins INT DEFAULT 50,
        today_xp INT DEFAULT 0,
        streak_data JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE test_history ADD COLUMN IF NOT EXISTS tab_switches INT DEFAULT 0;
      ALTER TABLE test_history ADD COLUMN IF NOT EXISTS tab_switch_logs JSONB;
      ALTER TABLE interview_history ADD COLUMN IF NOT EXISTS tab_switches INT DEFAULT 0;
      ALTER TABLE interview_history ADD COLUMN IF NOT EXISTS tab_switch_logs JSONB;
    `);

    // Check if question bank has data; if empty, automatically seed 1,000+ placement questions
    const qCountRes = await pool.query('SELECT COUNT(*) as total FROM questions');
    const totalQ = parseInt(qCountRes.rows[0].total, 10);
    if (totalQ === 0) {
      console.log('🌱 No questions found in database. Automatically seeding 1,000+ placement questions...');
      await seedQuestionBank(false);
      console.log('🎉 Question bank automatically seeded for students!');
    } else {
      console.log(`📚 Database active with ${totalQ} placement questions.`);
    }
  } catch (e) {
    console.warn('⚠️ Table init/seeding note:', e.message);
  }
})();

// Helper to get formatted local date string (YYYY-MM-DD)
function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayOfWeekKey(d = new Date()) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
}

// In-memory fallback cache for high speed / offline safety
const streakMemoryCache = new Map();

app.get('/api/student/streak/:email', authenticateToken, async (req, res) => {
  const email = (req.params.email || '').toLowerCase().trim();
  if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== email) {
    return res.status(403).json({ message: 'Forbidden: You are only permitted to view your own streak data.' });
  }


  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  try {
    let row = null;
    try {
      const dbRes = await pool.query('SELECT * FROM student_streaks WHERE LOWER(email) = $1', [email]);
      if (dbRes.rows.length > 0) {
        row = dbRes.rows[0];
      }
    } catch (dbErr) {
      // Fallback to memory
      row = streakMemoryCache.get(email);
    }

    if (!row) {
      // Create new streak record with day-1 default
      const defaultData = {
        weeklyActivity: { Mon: true, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
        todayQuests: { potd: false, practice: false, mock: false, duel: false, interview: false },
        recentHistory: [
          { type: 'login', title: 'Joined CampusEdge Platform', xp: 50, time: 'Just now', date: today }
        ],
        streakFreeze: 1
      };
      // Mark current day of week active
      defaultData.weeklyActivity[getDayOfWeekKey()] = true;

      const newRecord = {
        email,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
        total_xp: 250,
        coins: 100,
        today_xp: 50,
        streak_data: defaultData
      };

      try {
        await pool.query(
          `INSERT INTO student_streaks (email, current_streak, longest_streak, last_active_date, total_xp, coins, today_xp, streak_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO NOTHING`,
          [email, newRecord.current_streak, newRecord.longest_streak, newRecord.last_active_date, newRecord.total_xp, newRecord.coins, newRecord.today_xp, JSON.stringify(defaultData)]
        );
      } catch (e) {}

      streakMemoryCache.set(email, newRecord);
      row = newRecord;
    }

    let streakData = typeof row.streak_data === 'string' ? JSON.parse(row.streak_data) : (row.streak_data || {});
    let currentStreak = row.current_streak || 1;
    let longestStreak = row.longest_streak || 1;
    let lastActiveDate = row.last_active_date || today;
    let todayXP = row.today_xp || 0;
    let totalXP = row.total_xp || 250;
    let coins = row.coins || 100;

    // Check if day rolled over
    const isStreakActiveToday = (lastActiveDate === today);
    if (lastActiveDate !== today) {
      todayXP = 0; // Reset daily XP counter for a new day
      if (lastActiveDate !== yesterday) {
        // More than 1 day missed
        if (streakData.streakFreeze > 0) {
          streakData.streakFreeze -= 1; // Used freeze
        } else {
          currentStreak = 0; // Broken streak
        }
      }
      // Reset daily quests for new day
      streakData.todayQuests = { potd: false, practice: false, mock: false, duel: false, interview: false };
    }

    const level = Math.floor(totalXP / 1000) + 1;
    const levelTitles = ['Novice Aspirant', 'Code Apprentice', 'Skill Specialist', 'Placement Ready', 'Elite SDE', 'Campus Prodigy'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    const responsePayload = {
      email,
      currentStreak,
      longestStreak,
      lastActiveDate,
      isStreakActiveToday,
      todayXP,
      totalXP,
      coins,
      level,
      levelTitle,
      streakFreeze: streakData.streakFreeze !== undefined ? streakData.streakFreeze : 1,
      weeklyActivity: streakData.weeklyActivity || { Mon: true, Tue: true, Wed: false, Thu: true, Fri: false, Sat: false, Sun: false },
      todayQuests: streakData.todayQuests || { potd: false, practice: false, mock: false, duel: false, interview: false },
      recentHistory: streakData.recentHistory || []
    };

    res.json(responsePayload);
  } catch (err) {
    console.error('Error fetching student streak:', err);
    res.status(500).json({ message: 'Server error retrieving streak data' });
  }
});

// Internal helper function to record streak and XP advancement
async function recordStreakActivity(email, type = 'practice', xp = 50, coins = 10, title = 'Completed Learning Task') {
  const cleanEmail = email.toLowerCase().trim();
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();
  const dayKey = getDayOfWeekKey();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let row = null;
  try {
    const dbRes = await pool.query('SELECT * FROM student_streaks WHERE LOWER(email) = $1', [cleanEmail]);
    if (dbRes.rows.length > 0) {
      row = dbRes.rows[0];
    }
  } catch (e) {
    row = streakMemoryCache.get(cleanEmail);
  }

  let currentStreak = row ? (row.current_streak || 0) : 0;
  let longestStreak = row ? (row.longest_streak || 0) : 0;
  let totalXP = (row ? row.total_xp : 200) + Number(xp || 0);
  let todayXP = (row && row.last_active_date === today ? (row.today_xp || 0) : 0) + Number(xp || 0);
  let totalCoins = (row ? row.coins : 50) + Number(coins || 0);
  let lastActiveDate = row ? row.last_active_date : null;

  let streakData = row ? (typeof row.streak_data === 'string' ? JSON.parse(row.streak_data) : (row.streak_data || {})) : {};
  if (!streakData.weeklyActivity) streakData.weeklyActivity = {};
  if (!streakData.todayQuests) streakData.todayQuests = {};
  if (!Array.isArray(streakData.recentHistory)) streakData.recentHistory = [];

  // Check streak advancement
  if (lastActiveDate !== today) {
    if (lastActiveDate === yesterday || currentStreak === 0) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    lastActiveDate = today;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Update today's activity calendar and quests
  streakData.weeklyActivity[dayKey] = true;
  if (type) {
    streakData.todayQuests[type] = true;
  }

  // Append to live history
  streakData.recentHistory.unshift({
    type,
    title,
    xp: Number(xp || 0),
    coins: Number(coins || 0),
    time: timeStr,
    date: today
  });
  if (streakData.recentHistory.length > 20) {
    streakData.recentHistory = streakData.recentHistory.slice(0, 20);
  }

  const level = Math.floor(totalXP / 1000) + 1;
  const levelTitles = ['Novice Aspirant', 'Code Apprentice', 'Skill Specialist', 'Placement Ready', 'Elite SDE', 'Campus Prodigy'];
  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

  // Persist to DB
  try {
    await pool.query(
      `INSERT INTO student_streaks (email, current_streak, longest_streak, last_active_date, total_xp, coins, today_xp, streak_data, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
          current_streak = EXCLUDED.current_streak,
          longest_streak = EXCLUDED.longest_streak,
          last_active_date = EXCLUDED.last_active_date,
          total_xp = EXCLUDED.total_xp,
          coins = EXCLUDED.coins,
          today_xp = EXCLUDED.today_xp,
          streak_data = EXCLUDED.streak_data,
          updated_at = CURRENT_TIMESTAMP`,
      [cleanEmail, currentStreak, longestStreak, lastActiveDate, totalXP, totalCoins, todayXP, JSON.stringify(streakData)]
    );
  } catch (e) {
    streakMemoryCache.set(cleanEmail, {
      email: cleanEmail,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: lastActiveDate,
      total_xp: totalXP,
      coins: totalCoins,
      today_xp: todayXP,
      streak_data: streakData
    });
  }

  return {
    email: cleanEmail,
    currentStreak,
    longestStreak,
    lastActiveDate,
    isStreakActiveToday: true,
    todayXP,
    totalXP,
    coins: totalCoins,
    level,
    levelTitle,
    streakFreeze: streakData.streakFreeze !== undefined ? streakData.streakFreeze : 1,
    weeklyActivity: streakData.weeklyActivity,
    todayQuests: streakData.todayQuests,
    recentHistory: streakData.recentHistory
  };
}

// Record an interactive activity in real-time (Protected)
app.post('/api/student/streak/record-activity', authenticateToken, async (req, res) => {
  const { type = 'practice', xp = 50, coins = 10, title = 'Completed Learning Task' } = req.body;
  const studentEmail = req.user.email;

  try {
    const streak = await recordStreakActivity(studentEmail, type, xp, coins, title);
    res.json({
      success: true,
      message: `Streak updated! +${xp} XP gained.`,
      streak
    });
  } catch (err) {
    console.error('Error recording streak activity:', err);
    res.status(500).json({ message: 'Server error updating streak' });
  }
});

// Claim Daily Login Bonus (Protected)
app.post('/api/student/streak/claim-daily-reward', authenticateToken, async (req, res) => {
  const studentEmail = req.user.email;

  try {
    const streak = await recordStreakActivity(studentEmail, 'bonus', 100, 25, 'Claimed Daily Practice Bonus 🔥');
    res.json({
      success: true,
      message: 'Daily bonus claimed successfully! +100 XP, +25 Coins.',
      streak
    });
  } catch (err) {
    console.error('Error claiming daily bonus:', err);
    res.status(500).json({ message: 'Failed to claim reward' });
  }
});


// ==========================================
// TEST HISTORY ENDPOINTS
// ==========================================

app.post('/api/questions/save-history', authenticateToken, async (req, res) => {
  const userEmail = req.user.email.toLowerCase().trim();
  const { category, score, total, percentage, test_date, fullData, tab_switches, tabSwitches } = req.body;
  const recordedSwitches = parseInt(tab_switches !== undefined ? tab_switches : (tabSwitches || (fullData && fullData.tabSwitches) || 0), 10) || 0;

  try {
    const query = `
      INSERT INTO test_history (email, category, score, total, percentage, test_date, full_data, tab_switches)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      userEmail, 
      category, 
      score, 
      total, 
      percentage, 
      test_date || new Date().toLocaleDateString(), 
      JSON.stringify(fullData || {}),
      recordedSwitches
    ];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'History saved successfully', record: result.rows[0] });
  } catch (err) {
    console.error('Error saving test history:', err);
    res.status(500).json({ message: 'Server error saving test history' });
  }
});

app.get('/api/questions/history/:email', authenticateToken, async (req, res) => {
  const targetEmail = (req.params.email || '').toLowerCase().trim();
  if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
    return res.status(403).json({ message: 'Forbidden: You are only permitted to view your own test history.' });
  }

  try {
    const query = `SELECT id, email, category, score, total, percentage, test_date, full_data, COALESCE(tab_switches, 0) AS tab_switches FROM test_history WHERE LOWER(email) = $1 ORDER BY id DESC;`;
    const result = await pool.query(query, [targetEmail]);
    const formattedRows = result.rows.map(row => {
      const full = typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {});
      return {
        ...row,
        tab_switches: row.tab_switches !== undefined ? row.tab_switches : (full.tabSwitches || 0),
        full_data: full
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching test history:', err);
    res.status(500).json({ message: 'Server error fetching test history' });
  }
});


app.get('/api/questions/admin/all-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT id, email AS user_email, category, score, total, percentage, test_date, full_data, COALESCE(tab_switches, 0) AS tab_switches 
      FROM test_history 
      ORDER BY id DESC;
    `;
    const result = await pool.query(query);
    const formattedRows = result.rows.map(row => {
      const full = typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {});
      return {
        ...row,
        tab_switches: row.tab_switches !== undefined ? row.tab_switches : (full.tabSwitches || 0),
        full_data: full
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching all test history for admin:', err);
    res.status(500).json({ message: 'Server error fetching history.' });
  }
});

// Admin Bulk Delete (Protected)
app.delete('/api/admin/bulk-delete', authenticateToken, requireAdmin, async (req, res) => {
  const { table, ids } = req.body;
  try {
    const allowedTables = ['questions', 'test_history', 'users', 'resume_history', 'roadmap_history', 'interview_history', 'company_eligibility_history', 'admin_job_drives', 'student_job_applications', 'notifications'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ message: 'Invalid table target specified.' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No record IDs provided for deletion.' });
    }
    const query = `DELETE FROM ${table} WHERE id = ANY($1::int[]) RETURNING id;`;
    const result = await pool.query(query, [ids]);
    res.status(200).json({ 
      message: `Successfully deleted ${result.rowCount} records.`, 
      deletedIds: result.rows.map(r => r.id) 
    });
  } catch (err) {
    console.error('Error during bulk deletion:', err);
    res.status(500).json({ message: 'Server error executing bulk delete.' });
  }
});

// Admin Delete by Category (Protected)
app.delete('/api/admin/delete-by-category', authenticateToken, requireAdmin, async (req, res) => {
  const { category } = req.body;
  try {
    if (!category) {
      return res.status(400).json({ message: 'No category specified.' });
    }
    const query = `DELETE FROM questions WHERE category = $1 RETURNING id;`;
    const result = await pool.query(query, [category]);
    res.status(200).json({ 
      message: `Successfully deleted ${result.rowCount} questions in category '${category}'.`, 
      deletedCount: result.rowCount 
    });
  } catch (err) {
    console.error('Error deleting questions by category:', err);
    res.status(500).json({ message: 'Server error deleting category.' });
  }
});

// Admin Promote User to Admin (Protected)
app.put('/api/admin/promote-user/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE users 
      SET role = 'admin' 
      WHERE id = $1 
      RETURNING id, name, email, role;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ 
      message: `Successfully promoted ${result.rows[0].email} to Admin.`, 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('Error promoting user:', err);
    res.status(500).json({ message: 'Server error promoting user.' });
  }
});

// Mount modular sub-routers
app.use('/api/questions', questionRoutes);
// Google OAuth Integration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendBaseUrl}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

        if (existingUser.rows.length > 0) {
          return done(null, existingUser.rows[0]);
        }

        const newUser = await pool.query(
          `INSERT INTO users (name, email, password, role, address) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [name, email, 'GOOGLE_AUTH_USER', 'student', 'Not Provided']
        );
        return done(null, newUser.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
      const user = req.user;
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        hometown: user.hometown,
        address: user.address,
        token: token
      }));
      res.redirect(`${clientBaseUrl}?googleUser=${userData}`);
    }
  );
}

// Google GenAI Instance
const { GoogleGenAI } = require('@google/genai');
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ==========================================
// PLACEMENT ROADMAP ENDPOINTS (Real-Time AI Generated per Role & Stream)
// ==========================================
app.post('/api/roadmap/generate', rateLimiter({ max: 30 }), optionalAuth, async (req, res) => {
  const { email, subject, role, targetCompany, stream, timeframe, experienceLevel } = req.body;
  try {
    const targetRole = (role || subject || 'Software Development Engineer').trim();
    if (!targetRole) {
      return res.status(400).json({ message: 'Target role or subject is required.' });
    }

    const company = (targetCompany || 'Top Tech Recruiters & Unicorns').trim();
    const studentStream = (stream || 'Computer Science & Engineering').trim();
    const duration = (timeframe || '60 Days').trim();
    const expLevel = (experienceLevel || 'Fresher / Campus Placement').trim();

    if (ai) {
      try {
        const prompt = `You are a Principal Engineering Career Architect & University Placement Director.
Generate a comprehensive, real-time milestone preparation roadmap for a student aiming for the target career role: "${targetRole}"
Context:
- Target Recruiter / Company Profile: "${company}"
- Academic Stream: "${studentStream}"
- Target Timeframe: "${duration}"
- Experience Level: "${expLevel}"

Return ONLY a valid JSON object matching this exact structure:
{
  "subject": "${targetRole}",
  "roleTitle": "${targetRole}",
  "targetCompany": "${company}",
  "timeframe": "${duration}",
  "overview": "Clear 2-sentence executive summary of this career roadmap and industry market demand for ${targetRole}.",
  "recommendedTechStack": ["Tech 1", "Tech 2", "Tech 3", "Tech 4", "Tech 5"],
  "phases": [
    {
      "phaseNumber": 1,
      "phase": "Phase 1: Foundational Core & Syntax Mastery",
      "duration": "Weeks 1 - 2",
      "goal": "Master the syntax, fundamental algorithms, and core domain principles.",
      "topics": [
        "Core syntax and design paradigms essential for ${targetRole}",
        "Data structures and baseline algorithmic complexity",
        "Setting up production-grade dev environment and version control"
      ],
      "practicalAction": "Build a clean foundational module implementing core domain patterns.",
      "recommendedResources": ["Official Documentation", "CampusEdge Practice Modules", "LeetCode Core Patterns"]
    },
    {
      "phaseNumber": 2,
      "phase": "Phase 2: Modern Frameworks, APIs & System Architecture",
      "duration": "Weeks 3 - 5",
      "goal": "Build deep proficiency in the primary industry frameworks and database systems.",
      "topics": [
        "Deep-dive into industry-standard frameworks and state/memory management",
        "REST/GraphQL API design and database query optimization",
        "Unit testing, asynchronous workflows, and security best practices"
      ],
      "practicalAction": "Develop a functional full-featured application with database persistence and authentication.",
      "recommendedResources": ["Framework Documentation", "API Architecture Best Practices"]
    },
    {
      "phaseNumber": 3,
      "phase": "Phase 3: Production Capstone Project & Cloud Deployment",
      "duration": "Weeks 6 - 7",
      "goal": "Construct and deploy a high-impact portfolio capstone with CI/CD and scalability.",
      "topics": [
        "Architecting a scalable multi-tier system tailored for ${targetRole}",
        "Containerization with Docker, cloud hosting (AWS/Vercel/GCP), and CI/CD pipelines",
        "Performance optimization, latency reduction, and caching"
      ],
      "practicalAction": "Deploy a live project with a public GitHub repo, CI/CD pipeline, and detailed README architecture diagram.",
      "recommendedResources": ["System Design Guide", "Cloud Deployment Walkthroughs"]
    },
    {
      "phaseNumber": 4,
      "phase": "Phase 4: Interview Cracking, Mock Simulations & Offer Negotiation",
      "duration": "Weeks 8 - 9",
      "goal": "Master technical coding assessments, system design, and HR behavioral rounds.",
      "topics": [
        "Company-specific interview problem patterns and live whiteboard rounds",
        "STAR-method behavioral interview answers for ${company}",
        "ATS resume keyword alignment and GitHub/portfolio optimization"
      ],
      "practicalAction": "Complete 3 full AI Mock Interviews on CampusEdge and audit resume against ATS.",
      "recommendedResources": ["CampusEdge AI Interview Simulator", "CampusEdge ATS Scanner"]
    }
  ],
  "capstoneProjectIdeas": [
    {
      "title": "Production-Grade Capstone Project 1",
      "description": "A high-concurrency real-world application showcasing core ${targetRole} capabilities.",
      "techStack": "React, Node.js, PostgreSQL, Redis"
    },
    {
      "title": "Scalable Cloud Architecture Project 2",
      "description": "An end-to-end distributed system with automated CI/CD and cloud deployment.",
      "techStack": "Go / Python, Docker, Kubernetes, AWS"
    }
  ],
  "interviewChecklist": [
    "Master top 50 coding and DSA patterns for ${targetRole}",
    "Be ready to defend project architecture choices and trade-offs",
    "Prepare STAR answers for teamwork, conflict resolution, and leadership",
    "Have a live deployed URL and clean GitHub repository ready"
  ]
}`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const parsed = cleanAndParseAIJson(response.text, null);
        if (parsed && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          const effectiveEmail = email || 'default@student.com';
          if (effectiveEmail !== 'default@student.com') {
            await pool.query(
              `INSERT INTO roadmap_history (email, subject, full_data, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *;`,
              [effectiveEmail, targetRole, JSON.stringify(parsed)]
            ).catch(err => console.warn("Roadmap history save warning:", err.message));
          }
          return res.status(200).json(parsed);
        }
      } catch (aiErr) {
        console.warn("Roadmap Gemini generation error fallback:", aiErr.message);
      }
    }

    // Role-tailored deterministic fallback
    let fallbackData = {
      subject: targetRole,
      roleTitle: targetRole,
      targetCompany: company,
      timeframe: duration,
      overview: `A structured, multi-phase technical roadmap tailored specifically for mastering ${targetRole} from fundamental concepts to placement interview readiness.`,
      recommendedTechStack: ["Core Language / Runtime", "Modern Framework", "Database & ORM", "Docker & Cloud", "Git & CI/CD"],
      phases: [
        {
          phaseNumber: 1,
          phase: `Phase 1: Core Fundamentals & Language Foundations`,
          duration: "Weeks 1 - 2",
          goal: `Master core programming paradigms, syntax, and foundational problem solving for ${targetRole}.`,
          topics: [
            `Core syntax, object-oriented concepts, and memory principles for ${targetRole}`,
            "Essential data structures (Arrays, HashMaps, Trees, Graphs)",
            "Setting up clean version control workflows with Git and GitHub"
          ],
          practicalAction: "Complete 20 foundational coding drills and push code to GitHub.",
          recommendedResources: ["CampusEdge Practice Modules", "Official Docs", "LeetCode Mediums"]
        },
        {
          phaseNumber: 2,
          phase: "Phase 2: Modern Frameworks & API Architecture",
          duration: "Weeks 3 - 5",
          goal: `Build hands-on expertise with primary frameworks, databases, and APIs used in ${targetRole}.`,
          topics: [
            "Building RESTful and GraphQL APIs with database persistence",
            "State management, asynchronous streams, and middleware",
            "Database normalization, indexing, and SQL optimization"
          ],
          practicalAction: "Build and test a multi-route CRUD application with authentication.",
          recommendedResources: ["Framework Documentation", "SQL Optimization Guides"]
        },
        {
          phaseNumber: 3,
          phase: "Phase 3: Production Capstone Project & Cloud Deployment",
          duration: "Weeks 6 - 7",
          goal: "Construct and deploy a production-grade portfolio project with cloud hosting.",
          topics: [
            "Architecting a scalable system with caching and background workers",
            "Containerization using Docker and automated CI/CD deployment",
            "Unit testing, integration testing, and performance profiling"
          ],
          practicalAction: `Deploy a full capstone project tailored for ${targetRole} to the cloud with a public live demo URL.`,
          recommendedResources: ["System Design Primer", "Cloud Deployment Guide"]
        },
        {
          phaseNumber: 4,
          phase: "Phase 4: Placement Preparation & Mock Interviews",
          duration: "Weeks 8 - 9",
          goal: `Crack technical rounds, HR behavioral questions, and ATS resume screening for ${company}.`,
          topics: [
            `Company-specific coding test patterns and DSA rounds for ${company}`,
            "System design walkthroughs and live project defense",
            "STAR-format HR behavioral answers and ATS keyword optimization"
          ],
          practicalAction: "Complete 3 full AI Mock Interviews on CampusEdge and audit resume score.",
          recommendedResources: ["CampusEdge AI Interview Simulator", "CampusEdge ATS Scanner"]
        }
      ],
      capstoneProjectIdeas: [
        {
          title: `Full-Stack ${targetRole} Enterprise Application`,
          description: `A production-ready platform demonstrating database design, caching, and clean architecture.`,
          techStack: "React, Node.js, PostgreSQL, Docker"
        },
        {
          title: "High-Performance Cloud Microservices System",
          description: "A distributed system handling background tasks, message queues, and API rate limiting.",
          techStack: "Go / Python, Redis, Docker, AWS"
        }
      ],
      interviewChecklist: [
        `Master top 50 interview questions for ${targetRole}`,
        "Explain architecture trade-offs with confidence",
        "Prepare STAR answers for behavioral and teamwork rounds",
        "Have deployed projects ready for live interviewer walkthrough"
      ]
    };

    if (email && email !== 'default@student.com') {
      await pool.query(
        `INSERT INTO roadmap_history (email, subject, full_data, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *;`,
        [email, targetRole, JSON.stringify(fallbackData)]
      ).catch(err => console.warn("Roadmap history save error:", err.message));
    }

    res.status(200).json(fallbackData);
  } catch (err) {
    console.error('Error generating roadmap:', err);
    res.status(500).json({ message: 'Server error generating placement roadmap.' });
  }
});

app.get('/api/roadmap/history/:email', authenticateToken, async (req, res) => {
  const targetEmail = (req.params.email || '').toLowerCase().trim();
  if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
    return res.status(403).json({ message: 'Forbidden: You are only permitted to view your own roadmap history.' });
  }

  try {
    const query = `SELECT * FROM roadmap_history WHERE LOWER(email) = $1 ORDER BY id DESC;`;
    const result = await pool.query(query, [targetEmail]);

    const formattedRows = result.rows.map(row => {
      let parsed = {};
      try {
        parsed = typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {});
      } catch (e) {
        parsed = {};
      }
      return {
        id: row.id,
        subject: row.subject || parsed.roleTitle || 'Career Track',
        date: new Date(row.created_at).toLocaleDateString(),
        ...parsed
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching roadmap history:', err);
    res.status(500).json({ message: 'Server error fetching roadmap history.' });
  }
});

// ==========================================
// COMPANY ELIGIBILITY AI CHECKER & HISTORY (Role, Stream & Any Scale Company Aware)
// ==========================================
app.post('/api/company/eligibility', rateLimiter({ max: 30, message: 'Too many requests. Please wait a moment.' }), async (req, res) => {
  const { tenth, twelfthOrDiploma, degree, cgpa, companyName, targetRole, activeBacklogs, gradYear, companyScale } = req.body;

  try {
    if (!companyName || !cgpa) {
      return res.status(400).json({ message: 'Company name and CGPA are required.' });
    }

    const role = (targetRole || 'Software Engineer').trim();
    const company = companyName.trim();
    const numCgpa = parseFloat(cgpa) || 0;
    const backlogs = parseInt(activeBacklogs, 10) || 0;
    const studentDegree = degree || 'B.Tech Computer Science & Engineering';
    const scale = (companyScale || 'auto').trim();

    if (ai) {
      try {
        const prompt = `You are a Principal University Placement Director evaluating a student's real-time eligibility for the role "${role}" at the company "${company}" (Company Scale/Type: ${scale}).

NOTE: The student may enter ANY company, including small startups, local firms, mid-market product companies, boutique agencies, or unlisted niche tech companies.
- If it is a lesser-known or early-stage startup, evaluate realistically: they prioritize practical coding/projects over strict CGPA, with typical packages ₹6-16 LPA and practical machine coding.
- If it is a mid-sized product scale-up, evaluate standard benchmarks (6.5+ CGPA, ₹8-18 LPA).
- If it is a prominent tech firm, apply standard tier-1 cutoffs.

Student Profile:
- Degree / Stream: ${studentDegree}
- Current CGPA: ${cgpa}
- 10th Standard %: ${tenth || 'N/A'}%
- 12th / Diploma %: ${twelfthOrDiploma || 'N/A'}%
- Active Backlogs: ${backlogs}
- Expected Graduation Year: ${gradYear || '2026'}

Compute an overall match percentage (0-100), expected fresher CTC package range, selection process rounds, mandatory technical skills, and detailed feedback.

Return ONLY valid JSON matching this exact structure:
{
  "companyName": "${company}",
  "targetRole": "${role}",
  "companyTier": "Early-Stage Startup / Mid-Sized Product / Enterprise",
  "isEligible": true,
  "matchPercentage": 88,
  "matchStatus": "Eligible & High Probability Match",
  "expectedPackage": "₹8 LPA - ₹15 LPA CTC",
  "criteriaSummary": {
    "requiredCgpa": "6.5 CGPA (Relaxable with strong project portfolio)",
    "required10th": "60%",
    "required12th": "60%",
    "backlogPolicy": "0 active backlogs allowed",
    "eligibleDegrees": "B.Tech (CS/IT/AI/ECE), MCA, BCA"
  },
  "selectionRounds": [
    "Round 1: Practical Machine Coding / Take-Home Project Assignment",
    "Round 2: Technical Domain Interview & Live Code Walkthrough",
    "Round 3: Problem Solving & Core Fundamentals",
    "Round 4: Founder / HR Cultural Fit Discussion"
  ],
  "mandatorySkillStack": [
    "Practical Framework / Tech Stack (e.g. React / Node / Python)",
    "Data Structures & Problem Solving",
    "Database & API Integration",
    "Git & Clean Code Practices"
  ],
  "detailedFit": {
    "academicsFit": "Your ${cgpa} CGPA is well-aligned with ${company}'s hiring expectations.",
    "backlogFit": "${backlogs === 0 ? 'Zero active backlogs gives you full eligibility.' : 'Active backlogs need resolution before joining.'}",
    "streamFit": "${studentDegree} gives you the required foundational expertise."
  },
  "reasoning": "Realistic 2-3 sentence assessment of candidate fit for ${role} at ${company}.",
  "improvementTips": [
    "Build and deploy a live project demonstrating core skills for ${role}.",
    "Prepare for live coding and practical problem-solving discussions."
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const parsed = cleanAndParseAIJson(response.text);
        if (parsed.companyName && parsed.matchStatus) {
          return res.status(200).json(parsed);
        }
      } catch (aiErr) {
        console.warn("Gemini eligibility check fallback:", aiErr.message);
      }
    }

    // Role & Company Tier Aware Deterministic Fallback
    const isTier1 = /google|amazon|microsoft|apple|netflix|meta|uber|goldman|adobe|deshaw/i.test(company);
    const isStartup = /cred|zomato|swiggy|razorpay|zepto|groww|postman|blinkit|flipkart|ola|urban|startup|seed|series/i.test(company);
    const isServicePrime = /digital|prime|specialist|innovator|turbo/i.test(role);
    
    let requiredCgpaNum = 6.0;
    let expectedPackageStr = "₹4 LPA - ₹7 LPA CTC";
    let defaultRounds = [
      "Round 1: Online Technical Aptitude & Coding Test",
      "Round 2: Technical Domain Interview (DSA + Projects)",
      "Round 3: Core CS Principles (DBMS, OS, Networks)",
      "Round 4: HR & Behavioral Culture Fit"
    ];

    if (isTier1) {
      requiredCgpaNum = 7.5;
      expectedPackageStr = "₹18 LPA - ₹32 LPA CTC";
      defaultRounds = [
        "Round 1: Online Coding Assessment (2 LeetCode Medium/Hard)",
        "Round 2: Data Structures & Algorithmic Problem Solving",
        "Round 3: System Design & Low-Level Architecture",
        "Round 4: Bar-Raiser & Behavioral Alignment"
      ];
    } else if (isStartup) {
      requiredCgpaNum = 6.5;
      expectedPackageStr = "₹14 LPA - ₹25 LPA CTC + ESOPs";
      defaultRounds = [
        "Round 1: Machine Coding / Practical Project Assessment (2-3 hrs)",
        "Round 2: Core Engineering, Data Structures & Problem Solving",
        "Round 3: Live System Architecture & Tech Stack Deep-Dive",
        "Round 4: Founder / Cultural Fit & Ownership Round"
      ];
    } else if (isServicePrime) {
      requiredCgpaNum = 7.0;
      expectedPackageStr = "₹7.5 LPA - ₹12 LPA CTC";
      defaultRounds = [
        "Round 1: Advanced Coding Assessment (Automata / HackerEarth)",
        "Round 2: Hands-on Technical Interview & Project Defense",
        "Round 3: Managerial & HR Alignment Round"
      ];
    } else {
      requiredCgpaNum = 6.5;
      expectedPackageStr = "₹5 LPA - ₹9 LPA CTC";
    }

    const isEligible = numCgpa >= requiredCgpaNum && backlogs === 0;
    const matchPct = Math.min(100, Math.max(35, Math.round((numCgpa / requiredCgpaNum) * 85) - (backlogs * 20)));

    res.status(200).json({
      companyName: company,
      targetRole: role,
      isEligible: isEligible,
      matchPercentage: matchPct,
      matchStatus: isEligible ? "Eligible & Strong Match" : (numCgpa >= requiredCgpaNum ? "Backlog Restriction" : "Cutoff Below Benchmark"),
      expectedPackage: expectedPackageStr,
      criteriaSummary: {
        requiredCgpa: `${requiredCgpaNum} CGPA (Portfolio can relax)`,
        required10th: "60%",
        required12th: "60%",
        backlogPolicy: "0 active backlogs allowed",
        eligibleDegrees: "B.Tech (CS/IT/AI/ECE), MCA"
      },
      selectionRounds: defaultRounds,
      mandatorySkillStack: [
        "Data Structures & Algorithms",
        "Core Language Proficiency (Python/Java/C++)",
        "Database Architecture & SQL",
        "Git & API Development"
      ],
      detailedFit: {
        academicsFit: numCgpa >= requiredCgpaNum ? `Your ${cgpa} CGPA satisfies the required ${requiredCgpaNum} cutoff.` : `Your ${cgpa} CGPA is below the ${requiredCgpaNum} benchmark.`,
        backlogFit: backlogs === 0 ? "Zero active backlogs satisfies all company placement criteria." : `${backlogs} active backlog(s) may restrict corporate application.`,
        streamFit: `${studentDegree} is actively recruited for this job profile.`
      },
      reasoning: `Based on recruitment analytics for ${company}'s ${role} positions, candidates with ${requiredCgpaNum}+ CGPA and zero backlogs are preferred. With your current standing of ${cgpa} CGPA in ${studentDegree}, you are ${isEligible ? 'well-positioned for shortlist qualification' : 'recommended to strengthen your project portfolio to compensate'}.`,
      improvementTips: [
        `Complete company-specific mock tests for ${company} on CampusEdge.`,
        `Polish practical implementations of ${role} projects with live demo links.`,
        `Practice timed problem solving on core Data Structures and Algorithms.`
      ]
    });
  } catch (err) {
    console.error('Error evaluating company eligibility:', err);
    res.status(500).json({ message: 'Server error checking eligibility.' });
  }
});

// ==========================================
// AUTO-MATCH ELIGIBLE COMPANIES FOR CANDIDATE
// ==========================================
app.post('/api/company/matched-companies', rateLimiter({ max: 30 }), async (req, res) => {
  const { cgpa, degree, tenth, twelfthOrDiploma, activeBacklogs, gradYear } = req.body;
  try {
    const numCgpa = parseFloat(cgpa) || 7.0;
    const backlogs = parseInt(activeBacklogs, 10) || 0;
    const studentDegree = degree || 'B.Tech Computer Science & Engineering';

    if (ai) {
      try {
        const prompt = `You are a Principal University Placement Director.
Evaluate a student with:
- Degree: ${studentDegree}
- CGPA: ${numCgpa}
- Active Backlogs: ${backlogs}
- 10th Score: ${tenth || '75'}%
- 12th/Diploma Score: ${twelfthOrDiploma || '75'}%
- Graduating Batch: ${gradYear || '2026'}

Return a structured list of at least 15 real-world tech companies (Startups, Big Tech, Mid-Size Product firms, Corporate Tech) that this student IS ELIGIBLE to apply for based on their CGPA and 0/few backlogs.

Return ONLY a valid JSON object matching this schema:
{
  "totalEligibleCount": 16,
  "matchTierSummary": "Based on your ${numCgpa} CGPA and zero active backlogs, you qualify for 16+ top-tier product and startup recruiters.",
  "categories": [
    {
      "categoryName": "🌟 Tier-1 Product & Big Tech",
      "companies": [
        {
          "name": "Google",
          "role": "Software Engineer (L3)",
          "icon": "🌐",
          "package": "₹18 - ₹32 LPA",
          "cutoff": "7.5 CGPA",
          "matchScore": 92,
          "hiringPill": "Eligible"
        }
      ]
    },
    {
      "categoryName": "🦄 High-Growth Startups & Unicorns",
      "companies": [
        {
          "name": "Zomato",
          "role": "Product SDE-1",
          "icon": "🍕",
          "package": "₹14 - ₹24 LPA",
          "cutoff": "6.5 CGPA",
          "matchScore": 96,
          "hiringPill": "Prime Fit"
        }
      ]
    },
    {
      "categoryName": "💼 Mid-Market & Premium Enterprise Drives",
      "companies": [
        {
          "name": "TCS Prime",
          "role": "Digital / Prime Developer",
          "icon": "🏢",
          "package": "₹7.5 - ₹11.5 LPA",
          "cutoff": "7.0 CGPA",
          "matchScore": 98,
          "hiringPill": "Open National Drive"
        }
      ]
    }
  ]
}`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const parsed = cleanAndParseAIJson(response.text);
        if (parsed && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          return res.status(200).json(parsed);
        }
      } catch (aiErr) {
        console.warn("Gemini matched-companies fallback:", aiErr.message);
      }
    }

    // High quality deterministic fallback
    const allKnownCompanies = [
      { name: "Google", role: "Software Engineer (L3)", icon: "🌐", package: "₹18 - ₹32 LPA", cutoffNum: 7.5, cutoff: "7.5 CGPA", category: "🌟 Tier-1 Product & Big Tech", hiringPill: "High Match" },
      { name: "Amazon", role: "SDE-1 (AWS / Retail)", icon: "📦", package: "₹16 - ₹28 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "🌟 Tier-1 Product & Big Tech", hiringPill: "Open Drive" },
      { name: "Microsoft", role: "Software Engineer", icon: "💻", package: "₹16 - ₹30 LPA", cutoffNum: 7.5, cutoff: "7.5 CGPA", category: "🌟 Tier-1 Product & Big Tech", hiringPill: "Campus Hire" },
      { name: "Uber", role: "Backend Software Engineer 1", icon: "🚗", package: "₹20 - ₹35 LPA", cutoffNum: 7.5, cutoff: "7.5 CGPA", category: "🌟 Tier-1 Product & Big Tech", hiringPill: "FinTech/Mobility" },
      { name: "Goldman Sachs", role: "Engineering Analyst", icon: "🏛️", package: "₹18 - ₹26 LPA", cutoffNum: 7.5, cutoff: "7.5 CGPA", category: "🌟 Tier-1 Product & Big Tech", hiringPill: "FinTech Giant" },

      { name: "Zomato", role: "Product Engineer (SDE-1)", icon: "🍕", package: "₹14 - ₹24 LPA", cutoffNum: 6.5, cutoff: "6.5 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "FoodTech" },
      { name: "CRED", role: "Backend / Platform Engineer", icon: "💳", package: "₹18 - ₹30 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "FinTech Unicorn" },
      { name: "Swiggy", role: "Software Engineer 1", icon: "🛵", package: "₹14 - ₹22 LPA", cutoffNum: 6.5, cutoff: "6.5 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "Consumer Tech" },
      { name: "Razorpay", role: "SDE (Payments Engine)", icon: "⚡", package: "₹16 - ₹26 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "Payments" },
      { name: "Zepto", role: "Full Stack Engineer", icon: "🚀", package: "₹14 - ₹22 LPA", cutoffNum: 6.5, cutoff: "6.5 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "Quick-Commerce" },
      { name: "Groww", role: "Software Engineer", icon: "📈", package: "₹14 - ₹22 LPA", cutoffNum: 6.8, cutoff: "6.8 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "WealthTech" },
      { name: "Postman", role: "API Systems Engineer", icon: "📬", package: "₹16 - ₹24 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "DevTools" },
      { name: "Hasura", role: "GraphQL / Platform SDE", icon: "⚡", package: "₹14 - ₹22 LPA", cutoffNum: 6.5, cutoff: "6.5 CGPA", category: "🦄 High-Growth Startups & Unicorns", hiringPill: "Open Source" },

      { name: "TCS Prime", role: "Digital / Prime Developer", icon: "🏢", package: "₹7.5 - ₹11.5 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "💼 Mid-Market & Premium Enterprise Drives", hiringPill: "National Drive" },
      { name: "Infosys Power", role: "Specialist Programmer", icon: "⚡", package: "₹6.5 - ₹9.5 LPA", cutoffNum: 6.8, cutoff: "6.8 CGPA", category: "💼 Mid-Market & Premium Enterprise Drives", hiringPill: "HackWithInfy" },
      { name: "Accenture", role: "Advanced App Engineering Analyst", icon: "💼", package: "₹6.5 - ₹8.5 LPA", cutoffNum: 6.5, cutoff: "6.5 CGPA", category: "💼 Mid-Market & Premium Enterprise Drives", hiringPill: "Consulting Tech" },
      { name: "Zoho", role: "Software Developer (Core Suite)", icon: "🛠️", package: "₹6.0 - ₹12 LPA", cutoffNum: 6.0, cutoff: "6.0 CGPA", category: "💼 Mid-Market & Premium Enterprise Drives", hiringPill: "Product Suite" },
      { name: "BrowserStack", role: "Software Engineer", icon: "🌐", package: "₹12 - ₹18 LPA", cutoffNum: 7.0, cutoff: "7.0 CGPA", category: "💼 Mid-Market & Premium Enterprise Drives", hiringPill: "DevTech" }
    ];

    // Filter companies where student meets the cutoff and backlogs criteria
    const eligibleList = allKnownCompanies.filter(c => {
      if (backlogs > 0 && c.cutoffNum >= 7.0) return false;
      return numCgpa >= c.cutoffNum;
    });

    const groupedCategories = [
      {
        categoryName: "🌟 Tier-1 Product & Big Tech",
        companies: eligibleList.filter(c => c.category === "🌟 Tier-1 Product & Big Tech").map(c => ({
          ...c,
          matchScore: Math.min(99, Math.round(85 + (numCgpa - c.cutoffNum) * 10))
        }))
      },
      {
        categoryName: "🦄 High-Growth Startups & Unicorns",
        companies: eligibleList.filter(c => c.category === "🦄 High-Growth Startups & Unicorns").map(c => ({
          ...c,
          matchScore: Math.min(99, Math.round(88 + (numCgpa - c.cutoffNum) * 10))
        }))
      },
      {
        categoryName: "💼 Mid-Market & Premium Enterprise Drives",
        companies: eligibleList.filter(c => c.category === "💼 Mid-Market & Premium Enterprise Drives").map(c => ({
          ...c,
          matchScore: Math.min(99, Math.round(90 + (numCgpa - c.cutoffNum) * 10))
        }))
      }
    ].filter(cat => cat.companies.length > 0);

    res.status(200).json({
      totalEligibleCount: eligibleList.length,
      matchTierSummary: `Based on your ${numCgpa} CGPA in ${studentDegree}, you are currently eligible to apply for ${eligibleList.length} top companies!`,
      categories: groupedCategories
    });
  } catch (err) {
    console.error('Error in matched companies:', err);
    res.status(500).json({ message: 'Server error finding matched companies.' });
  }
});

app.post('/api/company/save-history', authenticateToken, async (req, res) => {
  const userEmail = req.user.email.toLowerCase().trim();
  const { companyName, targetRole, isEligible, matchStatus, fullData } = req.body;
  try {
    const query = `
      INSERT INTO company_eligibility_history (email, company_name, is_eligible, match_status, full_data, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const fullPayload = {
      ...(fullData || {}),
      targetRole: targetRole || fullData?.targetRole || 'Software Engineer'
    };
    const result = await pool.query(query, [userEmail, companyName, isEligible, matchStatus, JSON.stringify(fullPayload)]);
    res.status(201).json({ message: 'Saved successfully', record: result.rows[0] });
  } catch (err) {
    console.error('Error saving eligibility history:', err);
    res.status(500).json({ message: 'Server error saving history.' });
  }
});

app.get('/api/company/history/:email', authenticateToken, async (req, res) => {
  const targetEmail = (req.params.email || '').toLowerCase().trim();
  if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
    return res.status(403).json({ message: 'Forbidden: You are only permitted to view your own eligibility history.' });
  }

  try {
    const query = `SELECT * FROM company_eligibility_history WHERE LOWER(email) = $1 ORDER BY id DESC;`;
    const result = await pool.query(query, [targetEmail]);

    const formattedRows = result.rows.map(row => {
      let parsed = {};
      try {
        parsed = typeof row.full_data === 'string' ? JSON.parse(row.full_data) : (row.full_data || {});
      } catch (e) {
        parsed = {};
      }
      return {
        id: row.id,
        companyName: row.company_name,
        targetRole: parsed.targetRole || 'Software Engineer',
        isEligible: row.is_eligible,
        matchStatus: row.match_status,
        date: new Date(row.created_at).toLocaleDateString(),
        ...parsed
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching eligibility history:', err);
    res.status(500).json({ message: 'Server error fetching history.' });
  }
});

// ==========================================
// AI INTERVIEW SIMULATOR ENDPOINTS (Stream & Role Aware + Round Type Selector)
// ==========================================
app.post('/api/interview/generate', rateLimiter({ max: 30 }), async (req, res) => {
  const { role, stream, companyPersona, experienceLevel, roundType } = req.body;
  try {
    const targetRole = (role || 'Software Engineer').trim();
    const targetStream = (stream || 'Computer Science & Engineering').trim();
    const targetCompany = (companyPersona || 'Tech Corporation').trim();
    const targetLevel = (experienceLevel || 'Fresher / Campus Placement').trim();
    const selectedRound = (roundType || 'hr').toLowerCase(); // 'hr', 'technical', 'mixed'

    if (ai) {
      try {
        let roundInstructions = '';
        if (selectedRound === 'hr') {
          roundInstructions = `You are a friendly HR Recruiter conducting a Campus Placement HR & Behavioral Round for a student applying for "${targetRole}" at "${targetCompany}".
Generate exactly 5 realistic, clear, friendly HR questions suited for a college student / fresher (NO overly complicated questions, keep them accessible and conversational):
1. Introduction & Background: Tell me about yourself and your journey in ${targetStream}.
2. Self-Awareness: What are your greatest strengths, and what is one skill or area you are actively improving?
3. Teamwork & Conflict: Describe a time you worked in a team on a college or personal project and had a disagreement. How did you resolve it?
4. Company Fit & Motivation: Why are you interested in joining ${targetCompany}, and where do you see your career in 2-3 years?
5. Work Ethics & Adaptability: How do you manage academic/work pressure and tight deadlines? Are you open to relocating or learning new tech stacks?`;
        } else if (selectedRound === 'technical') {
          roundInstructions = `You are a Senior Technical Interviewer conducting a Technical Domain Round for a fresher/student applying for "${targetRole}" with a background in "${targetStream}" at "${targetCompany}".
Generate exactly 5 clear, practical, student-level technical questions (accessible for college placement, avoid overly convoluted questions):
1. Project Overview: Walk me through a key project you built related to ${targetRole}. What problem did it solve, and what was your specific contribution?
2. Core Fundamentals: What core concepts, tools, or programming languages in ${targetStream} are you most proficient in, and why?
3. Practical Problem Solving: Explain how you debugged a tricky error or resolved a bug in one of your projects.
4. Technology Choices: Why did you choose the specific libraries, frameworks, or databases in your project over alternatives?
5. Design & Improvement: If you had more time to scale or enhance your recent project, what new features or optimizations would you implement?`;
        } else {
          roundInstructions = `You are a Technical HR Hiring Panel conducting a Comprehensive Campus Placement Round for a student applying for "${targetRole}" (${targetStream}) at "${targetCompany}".
Generate exactly 5 balanced, student-friendly questions (2 HR + 3 Technical):
1. Tell me about yourself and why you chose ${targetRole}. (HR)
2. Walk me through the architecture and tech stack of your best project. (Technical)
3. What is a core fundamental concept in ${targetStream} that you find most fascinating or useful? (Technical)
4. Tell me about a time you faced a difficult roadblock in a project and overcame it. (Behavioral)
5. Why ${targetCompany}, and how do you continuously learn new skills? (HR / Culture)`;
        }

        const prompt = `${roundInstructions}

Return ONLY a valid JSON array of 5 objects matching this exact schema:
[
  {
    "id": 1,
    "category": "HR Introduction / Technical Architecture / Behavioral",
    "type": "HR" or "Technical" or "Behavioral",
    "question": "Clear, direct question text",
    "keyHint": "Brief tip on what the interviewer is looking for in candidate's response",
    "expectedKeyPoints": ["Point 1", "Point 2"]
  }
]`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const questions = cleanAndParseAIJson(response.text, null);
        if (Array.isArray(questions) && questions.length > 0) {
          return res.status(200).json({ role: targetRole, stream: targetStream, companyPersona: targetCompany, roundType: selectedRound, questions });
        }
      } catch (aiErr) {
        console.warn("Interview generate AI fallback:", aiErr.message);
      }
    }

    // Role, Stream & Round-Type tailored fallbacks
    let fallbackQuestions = [];
    if (selectedRound === 'hr') {
      fallbackQuestions = [
        {
          id: 1,
          category: "Personal Introduction",
          type: "HR",
          question: `Can you briefly introduce yourself, highlighting your academic journey in ${targetStream} and why you're interested in ${targetRole}?`,
          keyHint: "Keep it under 90 seconds, clear, structured, and confident.",
          expectedKeyPoints: ["Academic background", "Passion for domain", "Key extracurriculars or projects"]
        },
        {
          id: 2,
          category: "Strengths & Growth Mindset",
          type: "HR",
          question: "What do you consider your greatest personal strength, and what is one area you are currently working on improving?",
          keyHint: "Show self-awareness, honesty, and proactive self-development.",
          expectedKeyPoints: ["Clear strength with example", "Constructive weakness with action plan"]
        },
        {
          id: 3,
          category: "Teamwork & Collaboration",
          type: "HR",
          question: "Tell me about a college group project or team experience where there was a disagreement. How did you handle it?",
          keyHint: "Highlight active listening, compromise, and focus on the common goal.",
          expectedKeyPoints: ["Situation context", "Respectful communication", "Successful outcome"]
        },
        {
          id: 4,
          category: "Company Motivation",
          type: "HR",
          question: `Why do you specifically want to start your career with ${targetCompany}, and where do you envision yourself in 2-3 years?`,
          keyHint: "Demonstrate knowledge about the company's culture and clear career aspirations.",
          expectedKeyPoints: ["Company values/mission", "Continuous learning goals", "Long-term commitment"]
        },
        {
          id: 5,
          category: "Work Ethics & Pressure Management",
          type: "HR",
          question: "How do you prioritize your tasks when facing multiple tight deadlines or academic stress?",
          keyHint: "Explain your organization methods (to-do lists, time blocking, milestone tracking).",
          expectedKeyPoints: ["Time management strategy", "Staying calm under pressure", "Communication when delayed"]
        }
      ];
    } else if (selectedRound === 'technical') {
      fallbackQuestions = [
        {
          id: 1,
          category: "Project Deep-Dive",
          type: "Technical",
          question: `Walk me through your favorite project in ${targetRole}. What problem did it solve, and what was your exact contribution?`,
          keyHint: "Explain the architecture, technologies used, and your personal coding contributions.",
          expectedKeyPoints: ["Problem statement", "Tech stack choice", "Personal role in building it"]
        },
        {
          id: 2,
          category: "Core Technical Concepts",
          type: "Technical",
          question: `What are the core foundational principles and tools you use most frequently in ${targetRole}?`,
          keyHint: "Demonstrate solid grasp of fundamental theory and practical tools.",
          expectedKeyPoints: ["Key language/frameworks", "Data handling / APIs", "Best practices used"]
        },
        {
          id: 3,
          category: "Debugging & Problem Solving",
          type: "Technical",
          question: "Describe a tricky bug or unexpected issue you encountered while building a project. How did you find and fix it?",
          keyHint: "Walk through your step-by-step diagnostic process (console logs, debugger, inspecting network).",
          expectedKeyPoints: ["Root cause analysis", "Debugging tools", "Permanent resolution"]
        },
        {
          id: 4,
          category: "Architecture & Trade-offs",
          type: "Technical",
          question: "Why did you choose the specific database, framework, or tools for your project instead of other options?",
          keyHint: "Show that you evaluate pros and cons rather than blindly picking tools.",
          expectedKeyPoints: ["Ease of development", "Performance requirements", "Community support & scalability"]
        },
        {
          id: 5,
          category: "Future Enhancements",
          type: "Technical",
          question: "If you had two more weeks to work on your latest project, what new features, security checks, or performance upgrades would you add?",
          keyHint: "Demonstrate vision, code quality awareness, and ambition.",
          expectedKeyPoints: ["Authentication/Security", "Performance caching/indexing", "Unit testing"]
        }
      ];
    } else {
      fallbackQuestions = [
        {
          id: 1,
          category: "Personal Introduction",
          type: "HR",
          question: `Tell me about yourself, your background in ${targetStream}, and what sparked your passion for ${targetRole}.`,
          keyHint: "Clear, concise introduction of academic background and key projects.",
          expectedKeyPoints: ["Education", "Key interest", "Career goal"]
        },
        {
          id: 2,
          category: "Project & Tech Stack",
          type: "Technical",
          question: `Walk me through the design and workflow of a significant project you built for ${targetRole}.`,
          keyHint: "Highlight your practical coding experience and component architecture.",
          expectedKeyPoints: ["Architecture", "Technologies utilized", "Overcoming roadblocks"]
        },
        {
          id: 3,
          category: "Domain Fundamentals",
          type: "Technical",
          question: `What fundamental technical concept in ${targetStream} do you feel is most crucial for writing reliable code?`,
          keyHint: "Demonstrate deep understanding of core engineering principles.",
          expectedKeyPoints: ["Theoretical clarity", "Real-world application", "Code quality"]
        },
        {
          id: 4,
          category: "Behavioral Challenge",
          type: "Behavioral",
          question: "Describe a situation where a project deadline was approaching fast and things weren't going according to plan. What actions did you take?",
          keyHint: "Structure with STAR format (Situation, Task, Action, Result).",
          expectedKeyPoints: ["Calm composure", "Prioritizing MVP features", "Team communication"]
        },
        {
          id: 5,
          category: "Company Fit & Growth",
          type: "HR",
          question: `Why are you interested in joining ${targetCompany}, and how do you stay updated with latest industry technologies?`,
          keyHint: "Show curiosity, proactive learning habits, and alignment with company goals.",
          expectedKeyPoints: ["Reading docs/blogs", "Building side projects", "Company alignment"]
        }
      ];
    }

    return res.status(200).json({ role: targetRole, stream: targetStream, companyPersona: targetCompany, roundType: selectedRound, questions: fallbackQuestions });
  } catch (err) {
    console.error('Error in interview generate:', err);
    res.status(500).json({ message: 'Server error generating interview questions.' });
  }
});

app.post('/api/interview/save-history', authenticateToken, async (req, res) => {
  const { role, stream, score, feedback, evaluation, tab_switches, tab_switch_logs, tabSwitches, tabSwitchLogs } = req.body;
  const userEmail = req.user.email.toLowerCase().trim();

  try {
    const query = `
      INSERT INTO interview_history (email, role, score, feedback, tab_switches, tab_switch_logs, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const fullSessionData = {
      stream: stream || 'Computer Science',
      feedback: feedback || [],
      evaluation: evaluation || {}
    };
    const switchCount = parseInt(tab_switches !== undefined ? tab_switches : (tabSwitches || 0), 10) || 0;
    const switchLogs = JSON.stringify(tab_switch_logs || tabSwitchLogs || []);
    const result = await pool.query(query, [
      userEmail, 
      role || 'Software Engineer', 
      score || 85, 
      JSON.stringify(fullSessionData),
      switchCount,
      switchLogs
    ]);
    res.status(201).json({ message: 'Interview session saved successfully', record: result.rows[0] });
  } catch (err) {
    console.error('Error saving interview history:', err);
    res.status(500).json({ message: 'Server error saving interview history.' });
  }
});

app.get('/api/interview/history/:email', authenticateToken, async (req, res) => {
  const targetEmail = (req.params.email || '').toLowerCase().trim();
  if (req.user.role !== 'admin' && req.user.email.toLowerCase().trim() !== targetEmail) {
    return res.status(403).json({ message: 'Forbidden: You are only permitted to view your own interview history.' });
  }

  try {
    const query = `SELECT id, email, role, score, feedback, COALESCE(tab_switches, 0) AS tab_switches, tab_switch_logs, created_at FROM interview_history WHERE LOWER(email) = $1 ORDER BY id DESC;`;
    const result = await pool.query(query, [targetEmail]);

    const formattedRows = result.rows.map(row => {
      let parsed = {};
      try {
        parsed = typeof row.feedback === 'string' ? JSON.parse(row.feedback) : (row.feedback || {});
      } catch (e) {
        parsed = {};
      }
      let parsedLogs = [];
      try {
        parsedLogs = typeof row.tab_switch_logs === 'string' ? JSON.parse(row.tab_switch_logs) : (row.tab_switch_logs || []);
      } catch (e) {
        parsedLogs = [];
      }
      return {
        ...row,
        stream: parsed.stream || 'Engineering',
        feedback: parsed.feedback || (Array.isArray(parsed) ? parsed : []),
        evaluation: parsed.evaluation || {},
        tab_switches: row.tab_switches || 0,
        tab_switch_logs: parsedLogs
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching interview history:', err);
    res.status(500).json({ message: 'Server error fetching interview history.' });
  }
});

app.post('/api/interview/turn', rateLimiter({ max: 40 }), async (req, res) => {
  const { role, stream, companyPersona, conversationHistory, studentAnswer, currentQuestionIndex } = req.body;
  try {
    const targetRole = role || 'Software Engineer';
    const targetStream = stream || 'Engineering';

    if (ai) {
      try {
        const prompt = `You are Sarah, an expert Senior Technical Recruiter at "${companyPersona || 'a top technology firm'}" conducting an interview for "${targetRole}" (Candidate background: "${targetStream}").
        
        Recent dialogue exchanges:
        ${JSON.stringify(conversationHistory ? conversationHistory.slice(-6) : [])}
        
        Candidate just said:
        "${studentAnswer || 'No verbal response.'}"
        
        Current question index: ${currentQuestionIndex !== undefined ? currentQuestionIndex : 1} of 5.
        
        Instructions:
        1. Give a natural, professional, encouraging 1-2 sentence response acknowledging their specific points.
        2. Seamlessly ask an insightful follow-up or transition naturally to the next phase of evaluation.
        3. Keep the tone warm, concise, and realistic like a real senior tech interviewer.
        
        Return ONLY the spoken conversational message.`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        let aiMessage = response.text ? response.text.trim() : '';
        return res.status(200).json({ aiMessage });
      } catch (aiErr) {
        console.warn("Interview turn AI fallback:", aiErr.message);
      }
    }

    const smartFallbacks = [
      `Thank you for detailing that experience. It shows strong initiative in your ${targetStream} background. Let's dig deeper into the problem-solving aspect.`,
      `Great explanation of your thought process. How did you ensure reliability and testing across that workflow?`,
      `That is an insightful perspective. How did your team measure the success of that project once delivered?`,
      `Excellent communication. Let's move to our next scenario regarding system optimization and design.`
    ];
    const idx = (currentQuestionIndex || 0) % smartFallbacks.length;
    res.status(200).json({ aiMessage: smartFallbacks[idx] });
  } catch (err) {
    console.error('Error in interview turn:', err);
    res.status(500).json({ message: 'Server error processing interview turn.' });
  }
});

app.post('/api/interview/evaluate', rateLimiter({ max: 20 }), async (req, res) => {
  const { role, stream, companyPersona, transcript } = req.body;
  try {
    const targetRole = role || 'Software Engineer';
    const targetStream = stream || 'Computer Science';
    const targetCompany = companyPersona || 'Tier 1 Tech Firm';

    if (ai) {
      try {
        const prompt = `You are a Principal Bar Raiser evaluating a candidate's complete interview for "${targetRole}" (${targetStream}) at "${targetCompany}".
        
        Full Interview Transcript:
        ${JSON.stringify(transcript || [])}
        
        Evaluate the candidate realistically across technical knowledge, fluency, and STAR structure.
        
        Return ONLY valid JSON matching this schema:
        {
          "overallScore": 84,
          "verdict": "Strong Hire / Hire / Leaning Hire / Needs Practice",
          "communicationScore": 86,
          "technicalScore": 82,
          "behavioralScore": 88,
          "keyStrengths": [
            "Clear and articulate STAR-format problem explanation",
            "Strong understanding of foundational concepts for ${targetRole}",
            "Honest reflection on past technical hurdles and learnings"
          ],
          "areasForImprovement": [
            "Incorporate more quantified business impact metrics in project overviews",
            "Elaborate more on architectural trade-offs between competing technologies",
            "Maintain steady pacing during complex multi-part technical explanations"
          ],
          "detailedFeedback": "Comprehensive 3-sentence recruiter summary evaluating placement readiness."
        }`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const scorecard = cleanAndParseAIJson(response.text, null);
        if (scorecard && scorecard.overallScore) {
          return res.status(200).json(scorecard);
        }
      } catch (aiErr) {
        console.warn("Interview evaluation AI fallback:", aiErr.message);
      }
    }

    // Default High-Quality Scorecard Fallback
    res.status(200).json({
      overallScore: 85,
      verdict: "Strong Hire",
      communicationScore: 88,
      technicalScore: 84,
      behavioralScore: 86,
      keyStrengths: [
        `Clear demonstration of core engineering fundamentals in ${targetStream}`,
        `Structured problem-solving approach tailored for ${targetRole}`,
        `Engaging communication style and positive professional composure`
      ],
      areasForImprovement: [
        "Include more concrete numerical figures (e.g. latency reduction, user count) in answers",
        "Deepen familiarity with enterprise-scale cloud deployments and CI/CD pipelines",
        "Structure behavioral scenarios tightly with distinct Situation, Task, Action, and Result phases"
      ],
      detailedFeedback: `Candidate demonstrated solid technical readiness for the ${targetRole} position at ${targetCompany}. With minor polish on quantified metric delivery, they are well-positioned for placement offers.`
    });
  } catch (err) {
    console.error('Error in interview evaluation:', err);
    res.status(500).json({ message: 'Server error evaluating interview.' });
  }
});

// ==========================================
// LEADERBOARD & ADMIN VIEWS
// ==========================================
// Mask email helper for student privacy
function maskEmailString(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name.charAt(0) + '***' : name.slice(0, 2) + '***' + name.slice(-1);
  return `${maskedName}@${domain}`;
}

app.get('/api/leaderboard', optionalAuth, async (req, res) => {
  try {
    const requesterEmail = (req.user?.email || req.query?.userEmail || '').toLowerCase().trim();
    const query = `
      SELECT 
        u.id,
        u.name, 
        u.email,
        COALESCE(SUM(t.score), 0) AS test_points,
        COALESCE(SUM(i.score), 0) AS interview_points,
        COALESCE(SUM(t.score), 0) + COALESCE(SUM(i.score), 0) AS total_score,
        COUNT(DISTINCT t.id) AS tests_completed,
        COUNT(DISTINCT i.id) AS interviews_completed
      FROM users u
      LEFT JOIN test_history t ON u.email = t.email
      LEFT JOIN interview_history i ON u.email = i.email
      WHERE LOWER(u.role) = 'student' OR u.role IS NULL OR u.role = ''
      GROUP BY u.id, u.name, u.email
      ORDER BY total_score DESC
      LIMIT 50;
    `;
    const result = await pool.query(query);
    const sanitizedRows = result.rows.map(row => {
      const isSelf = requesterEmail && row.email.toLowerCase() === requesterEmail;
      return {
        ...row,
        name: row.name || `Candidate #${row.id}`,
        email: isSelf ? row.email : maskEmailString(row.email),
        isCurrentUser: isSelf
      };
    });
    res.json(sanitizedRows);
  } catch (err) {
    console.error('Error fetching leaderboard data:', err);
    res.status(500).json({ message: 'Server error fetching leaderboard.' });
  }
});

app.get('/api/admin/leaderboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name, 
        u.email,
        COALESCE(SUM(t.score), 0) + COALESCE(SUM(i.score), 0) AS total_score,
        COUNT(DISTINCT t.id) AS tests_completed,
        COUNT(DISTINCT i.id) AS interviews_completed
      FROM users u
      LEFT JOIN test_history t ON u.email = t.email
      LEFT JOIN interview_history i ON u.email = i.email
      WHERE LOWER(u.role) = 'student' OR u.role IS NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY total_score DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching admin leaderboard:', err);
    res.status(500).json({ message: 'Server error fetching admin leaderboard.' });
  }
});

app.get('/api/admin/interviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id,
        i.email,
        i.role,
        i.score,
        i.feedback,
        COALESCE(i.tab_switches, 0) AS tab_switches,
        i.tab_switch_logs,
        i.created_at,
        u.name
      FROM interview_history i
      LEFT JOIN users u ON i.email = u.email
      ORDER BY i.created_at DESC;
    `;
    const result = await pool.query(query);
    const formattedRows = result.rows.map(row => {
      let parsedLogs = [];
      try {
        parsedLogs = typeof row.tab_switch_logs === 'string' ? JSON.parse(row.tab_switch_logs) : (row.tab_switch_logs || []);
      } catch (e) {
        parsedLogs = [];
      }
      return {
        ...row,
        feedback: typeof row.feedback === 'string' ? JSON.parse(row.feedback) : (row.feedback || []),
        tab_switches: row.tab_switches || 0,
        tab_switch_logs: parsedLogs
      };
    });
    res.json(formattedRows);
  } catch (err) {
    console.error('Error fetching admin interviews:', err);
    res.status(500).json({ message: 'Server error fetching interview logs.' });
  }
});

// ==========================================
// PLACEMENT DRIVES, NOTICES & AI PARSER
// ==========================================

// AI Notice Parser Endpoint (Admin Only)
app.post('/api/admin/drives/parse-notice', authenticateToken, requireAdmin, async (req, res) => {
  const { rawText } = req.body;
  try {
    if (!rawText) return res.status(400).json({ message: 'No text provided.' });

    if (ai) {
      const prompt = `Extract structured details from placement notice text:\n"""\n${rawText}\n"""\nReturn ONLY valid JSON matching format: {"companyName":"","website":"","noticeType":"Job Drive","role":"","packageVal":"","eligibility":"","internshipDetails":"","selectionProcess":"","fullTimeOffer":"","instructions":"","deadlineText":"","jobLocation":"","isLocalOnly":false}`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const parsed = cleanAndParseAIJson(response.text);
      return res.status(200).json(parsed);
    }

    res.status(200).json({
      companyName: "Extracted Company",
      noticeType: "Job Drive",
      role: "Software Engineer",
      packageVal: "As per industry standard",
      eligibility: rawText.slice(0, 200)
    });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ message: 'Failed to parse text.' });
  }
});

// Create Drive (Admin Only)
app.post('/api/admin/drives/create', authenticateToken, requireAdmin, (req, res) => {
  upload.single('pdfFile')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const { 
      companyName, website, role, eligibility, internshipDetails, 
      selectionProcess, fullTimeOffer, packageVal, applyLink, instructions, 
      deadlineText, deadlineTimestamp, noticeType, jobLocation, isLocalOnly 
    } = req.body;
    
    const pdfUrl = req.file ? `${BACKEND_URL}/uploads/${req.file.filename}` : (req.body.pdfUrl || null);
    const localFlag = isLocalOnly === 'true' || isLocalOnly === true;

    try {
      const query = `
        INSERT INTO admin_job_drives (
          company_name, website, role, eligibility, internship_details, 
          selection_process, full_time_offer, package, apply_link, instructions, 
          deadline_text, deadline_timestamp, notice_type, pdf_url, job_location, is_local_only, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING *;
      `;
      const result = await pool.query(query, [
        companyName || 'General Notice', website || null, role || 'Multiple Positions', 
        eligibility || null, internshipDetails || null, selectionProcess || null, fullTimeOffer || null, 
        packageVal || 'As per industry standard', applyLink || null, instructions || null, 
        deadlineText || null, deadlineTimestamp || null, noticeType || 'Job Drive', pdfUrl,
        jobLocation || null, localFlag
      ]);

      const newDrive = result.rows[0];

      // In-App Notification
      await pool.query(`INSERT INTO notifications (title, message, created_at) VALUES ($1, $2, NOW());`, [
        `📢 [${noticeType || 'Drive'}] ${companyName}: ${role} ${localFlag ? '(Location Restricted)' : ''}`,
        `New placement circular posted for ${jobLocation || 'All Locations'}. Deadline: ${deadlineText || 'Check details'}. Apply now!`
      ]);

      // Dispatch Email Broadcast Safely in background
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const studentsQuery = `SELECT email FROM users WHERE (LOWER(role) = 'student' OR role IS NULL OR role = '') AND email IS NOT NULL;`;
        pool.query(studentsQuery).then(studentsResult => {
          if (studentsResult.rows.length > 0) {
            const emailList = studentsResult.rows.map(s => s.email);
            const mailOptions = {
              from: process.env.EMAIL_USER,
              bcc: emailList,
              subject: `📢 Campus Notice: ${companyName} - ${role}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #4f46e5; margin-top: 0;">CampusEdge Placement Alert</h2>
                  <p>Hello Student,</p>
                  <p>A new placement notice has been published:</p>
                  <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #0f172a;">${companyName} - ${role}</h3>
                    <p style="margin: 4px 0;"><strong>Location:</strong> ${jobLocation || 'Any'}</p>
                    <p style="margin: 4px 0;"><strong>Deadline:</strong> <span style="color: #e11d48; font-weight: bold;">${deadlineText || 'Immediate'}</span></p>
                  </div>
                  <p>Log in to your CampusEdge Dashboard to review full eligibility and register.</p>
                </div>
              `
            };
            transporter.sendMail(mailOptions).catch(err => console.error("Email send error:", err.message));
          }
        }).catch(err => console.error("Student query error for email:", err.message));
      }

      res.status(201).json({ message: 'Notice published successfully', record: newDrive });
    } catch (err) {
      console.error('Create drive error:', err);
      res.status(500).json({ message: 'Server error posting notice.' });
    }
  });
});

// Fetch all drives (automatically removes expired drives from both admin and student views)
app.get('/api/drives/all', optionalAuth, async (req, res) => {
  const { includeExpired } = req.query;
  try {
    const query = `SELECT * FROM admin_job_drives ORDER BY id DESC;`;
    const result = await pool.query(query);
    
    // Robust multi-format deadline parser supporting ISO, DD/MM/YYYY, DD-MM-YYYY, Month DD YYYY, etc.
    const parseDeadlineDate = (text, timestamp) => {
      if (timestamp) {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
      }
      if (!text || typeof text !== 'string') return null;

      const trimmed = text.trim();

      // 1. Direct standard parse
      const direct = Date.parse(trimmed);
      if (!isNaN(direct)) {
        const d = new Date(direct);
        return d;
      }

      // 2. Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
      const dmyMatch = trimmed.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 23;
        const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 59;
        const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 59;
        const meridian = dmyMatch[7] ? dmyMatch[7].toLowerCase() : null;

        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;

        const d = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(d.getTime())) return d;
      }

      // 3. Handle "DD Month YYYY" e.g. "25 Oct 2026" or "25th October 2026 5:00 PM"
      const textCleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
      const monthMatch = textCleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (monthMatch) {
        const parsedMonth = Date.parse(`${monthMatch[2]} ${monthMatch[1]}, ${monthMatch[3]}`);
        if (!isNaN(parsedMonth)) {
          const d = new Date(parsedMonth);
          d.setHours(23, 59, 59, 999);
          return d;
        }
      }

      return null;
    };

    const isDriveExpired = (drive) => {
      const now = new Date();
      const deadlineDate = parseDeadlineDate(drive.deadline_text, drive.deadline_timestamp);
      if (deadlineDate) {
        return deadlineDate < now;
      }
      return false;
    };

    const formattedDrives = result.rows.map(drive => {
      const isExpired = isDriveExpired(drive);
      return { ...drive, isExpired };
    });

    // If requested specifically, return all, otherwise automatically remove expired
    if (includeExpired === 'true') {
      return res.json(formattedDrives);
    }

    const activeDrives = formattedDrives.filter(drive => !drive.isExpired);
    res.json(activeDrives);
  } catch (err) {
    console.error('Error fetching drives:', err);
    res.status(500).json({ message: 'Server error fetching drives.' });
  }
});

// Student Application with Screenshot Upload (Protected)
app.post('/api/student/drives/apply', authenticateToken, (req, res) => {
  upload.single('screenshotFile')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const email = req.user.email.toLowerCase().trim();
    const studentName = req.user.name || req.body.studentName || email.split('@')[0];
    const { driveId, additionalInfo } = req.body;
    const screenshotUrl = req.file ? `${BACKEND_URL}/uploads/${req.file.filename}` : null;


    try {
      const driveCheck = await pool.query(`SELECT * FROM admin_job_drives WHERE id = $1;`, [driveId]);
      if (driveCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Notice not found.' });
      }

      const drive = driveCheck.rows[0];
      if (drive.deadline_timestamp && new Date(drive.deadline_timestamp) < new Date()) {
        return res.status(400).json({ message: 'Registration deadline has passed. Applications are closed.' });
      }

      // Location match check if local only
      if (drive.is_local_only && drive.job_location) {
        const userRes = await pool.query(`SELECT address, hometown FROM users WHERE email = $1;`, [email]);
        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          const studentAddress = (user.address || '').toLowerCase();
          const studentHometown = (user.hometown || '').toLowerCase();
          const targetLocation = drive.job_location.toLowerCase();

          const isLocal = studentAddress.includes(targetLocation) || studentHometown.includes(targetLocation);
          if (!isLocal) {
            return res.status(403).json({ 
              message: `Application restricted: This placement drive is for local students residing in "${drive.job_location}".` 
            });
          }
        }
      }

      const existing = await pool.query(`SELECT * FROM student_job_applications WHERE drive_id = $1 AND email = $2;`, [driveId, email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'You have already applied for this notice.' });
      }

      const query = `
        INSERT INTO student_job_applications (drive_id, email, student_name, additional_info, screenshot_url, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'Applied', NOW())
        RETURNING *;
      `;
      const result = await pool.query(query, [driveId, email, studentName, additionalInfo, screenshotUrl]);
      res.status(201).json({ message: 'Successfully applied with confirmation proof!', record: result.rows[0] });
    } catch (err) {
      console.error('Error applying:', err);
      res.status(500).json({ message: 'Server error processing application.' });
    }
  });
});

// Admin Applicants Stats (Admin Only)
app.get('/api/admin/drives/:driveId/applicants', authenticateToken, requireAdmin, async (req, res) => {
  const { driveId } = req.params;
  try {
    const driveRes = await pool.query(`SELECT job_location, is_local_only FROM admin_job_drives WHERE id = $1;`, [driveId]);
    const drive = driveRes.rows[0] || {};

    const applicantsRes = await pool.query(`
      SELECT a.*, u.name, u.email, u.address, u.hometown 
      FROM student_job_applications a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.drive_id = $1
      ORDER BY a.id DESC;
    `, [driveId]);

    const totalStudentsRes = await pool.query(`SELECT COUNT(*) FROM users WHERE LOWER(role) = 'student' OR role IS NULL OR role = '';`);
    const totalStudents = parseInt(totalStudentsRes.rows[0].count, 10);

    res.json({
      jobLocation: drive.job_location,
      isLocalOnly: drive.is_local_only,
      totalRegisteredStudents: totalStudents,
      totalAppliedCount: applicantsRes.rows.length,
      applicants: applicantsRes.rows
    });
  } catch (err) {
    console.error('Error fetching applicants:', err);
    res.status(500).json({ message: 'Server error fetching applicants.' });
  }
});

// Admin Delete Drive (Admin Only)
app.delete('/api/admin/drives/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM admin_job_drives WHERE id = $1;`, [id]);
    res.status(200).json({ message: 'Drive deleted successfully.' });
  } catch (err) {
    console.error('Error deleting drive:', err);
    res.status(500).json({ message: 'Server error deleting drive.' });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM notifications ORDER BY id DESC LIMIT 10;`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications.' });
  }
});

app.delete('/api/admin/notifications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1;`, [req.params.id]);
    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification.' });
  }
});

// ==========================================
// AI CAREER ADVISOR CHATBOT ENDPOINT (Interactive Gemini 2.5)
// ==========================================
app.post('/api/chatbot/message', rateLimiter({ max: 50 }), async (req, res) => {
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'Message text is required.' });
  }

  const userQuery = message.trim();

  // If AI is available, use Google Gemini 2.5 Flash for natural interactive dialogue
  if (ai) {
    try {
      const historyContext = Array.isArray(conversationHistory)
        ? conversationHistory.slice(-8).map(m => `${m.sender === 'user' ? 'Student' : 'Advisor'}: ${m.text}`).join('\n')
        : '';

      const prompt = `You are the CampusEdge AI University Placement & Career Advisor on the CampusEdge landing page. You help new and existing university students understand the platform, prepare for campus recruitment drives, technical coding rounds, ATS resume optimization, system design, DSA, HR interviews, and company recruitment (Google, Microsoft, Amazon, Goldman Sachs, TCS, Infosys, Cognizant, Wipro, Accenture, etc.).

KEY FACTS ABOUT CAMPUSEDGE:
- 100% Free: No fees or hidden paywalls for students across all engineering branches (CSE, IT, AI/DS, ECE, EEE, Mechanical, Civil, Biotech) and Management (MBA).
- Core Modules:
  1. Question Bank & Mock Test Arena: 1,000+ verified technical MCQs across 17 subjects (DSA, OS, DBMS, Networks, System Design, React, Java, Python, C++, Aptitude) with timer and instant answer explanations.
  2. Online Multi-Language Code Compiler & Arena (Python, C++, Java, JS) with test cases and real-time outputs.
  3. AI Live Speech Mock Interview Simulator: Voice-powered interactive HR & technical interviews that listen to spoken answers, ask contextual follow-up questions, and score communication & technical clarity.
  4. Real-time ATS Resume Scanner: Upload PDF resume, get score out of 100, keyword match against Fortune 500 job descriptions, and fix formatting gaps.
  5. Placement Drives & Circulars: Direct updates on visiting companies, eligibility criteria (CGPA/backlogs), CTC salary packages, and deadlines.
  6. 1v1 Live Coding Battle & College Leaderboards.
- How to get started: Click "Get Started Free" or "Register" to create an account in 10 seconds or sign in with Google.

Recent conversation history:
${historyContext}

Student's latest message:
"${userQuery}"

Instructions:
1. Provide a direct, highly engaging, accurate, and welcoming response (2-4 sentences). Answer whatever the student asks factually and precisely.
2. If they ask about what CampusEdge is, how to start, registration, or cost, explain clearly and encourage them to try the free tools.
3. If the student asks for a quiz/test/practice question or says "quiz me", provide a multiple-choice question in the "quiz" field.
4. If appropriate, suggest one relevant action button ("actionType": "register" | "scroll_demo" | "scroll_ats" | "login").
5. Return ONLY valid JSON in this exact structure:
{
  "reply": "Your conversational answer here.",
  "quiz": null or {
    "category": "Subject Name",
    "question": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why Option A is correct."
  },
  "suggestedActions": [
    { "label": "Action Button Text", "actionType": "register" | "scroll_demo" | "scroll_ats" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const parsed = cleanAndParseAIJson(response.text, null);
      if (parsed && parsed.reply) {
        return res.status(200).json({
          reply: parsed.reply,
          quiz: parsed.quiz || null,
          action: (parsed.suggestedActions && parsed.suggestedActions[0]) || null
        });
      }
    } catch (aiErr) {
      console.warn("Gemini chatbot error fallback:", aiErr.message);
    }
  }

  // Comprehensive contextual fallback generator for offline / rate-limited queries
  const q = userQuery.toLowerCase();
  let fallbackReply = "Welcome to CampusEdge! We provide an all-in-one placement prep hub with 1,000+ verified MCQ questions, live AI voice mock interviews, multi-language code compiler, and instant ATS resume scoring — 100% free for all students.";
  let action = { label: 'Get Started Free ➔', actionType: 'register' };
  let quiz = null;

  if (q.includes('what is') || q.includes('about') || q.includes('how does it work') || q.includes('new student') || q.includes('start')) {
    fallbackReply = "CampusEdge is your university placement co-pilot! It helps students prepare for top tier campus drives (Google, Amazon, TCS, Infosys) through verified MCQ mock tests, real-time ATS resume scoring, live browser coding compilers, and voice-interactive AI HR mock interviews.";
    action = { label: 'Create Free Account ➔', actionType: 'register' };
  } else if (q.includes('free') || q.includes('cost') || q.includes('price') || q.includes('pay') || q.includes('charge')) {
    fallbackReply = "Yes, CampusEdge is 100% free for all college and university students! All practice modes, AI interview simulators, ATS resume diagnostics, and placement circulars are completely accessible without any paywalls.";
    action = { label: 'Register Free in 10s ➔', actionType: 'register' };
  } else if (q.includes('resume') || q.includes('ats') || q.includes('scanner') || q.includes('cv')) {
    fallbackReply = "Our ATS Resume Scanner evaluates your PDF resume against real Fortune 500 job descriptions. It scores your resume out of 100, detects industry keywords, and highlights missing technical skills to help you clear recruiter screening filters.";
    action = { label: 'Try ATS Resume Audit ➔', actionType: 'scroll_ats' };
  } else if (q.includes('interview') || q.includes('voice') || q.includes('speech') || q.includes('hr') || q.includes('simulator')) {
    fallbackReply = "The AI Voice Mock Interview simulator conducts real-time spoken technical and HR interview rounds. It listens to your voice answers, asks adaptive follow-up questions, and provides instantaneous communication, clarity, and technical scores.";
    action = { label: 'Preview Mock Interview ➔', actionType: 'scroll_demo' };
  } else if (q.includes('code') || q.includes('compiler') || q.includes('python') || q.includes('c++') || q.includes('java')) {
    fallbackReply = "Our built-in Coding Arena lets you solve algorithmic programming challenges with an integrated multi-language browser compiler (supporting Python, C++, Java, and JavaScript) with automated test cases and execution benchmarks.";
    action = { label: 'Try Live Code Compiler ➔', actionType: 'scroll_demo' };
  } else if (q.includes('branch') || q.includes('mechanical') || q.includes('civil') || q.includes('electrical') || q.includes('ece') || q.includes('mba')) {
    fallbackReply = "CampusEdge is designed for ALL students! While Computer Science and IT students focus on DSA and Web Dev, Core Engineering (ECE, EEE, Mech, Civil) and MBA students can practice Aptitude, Logical Reasoning, Core Subjects, and HR Rounds.";
    action = { label: 'Explore All Branches ➔', actionType: 'register' };
  } else if (q.includes('company') || q.includes('companies') || q.includes('google') || q.includes('amazon') || q.includes('microsoft') || q.includes('tcs') || q.includes('infosys')) {
    fallbackReply = "We provide tailored interview prep for both Product Giants (Amazon, Google, Microsoft, Goldman Sachs) and Mass Recruiters (TCS NQT, Infosys, Wipro, Cognizant, Accenture), covering company-specific aptitude patterns and DSA difficulty levels.";
    action = { label: 'Start Company Prep ➔', actionType: 'register' };
  } else if (q.includes('dsa') || q.includes('algorithm') || q.includes('tree') || q.includes('graph') || q.includes('dynamic programming')) {
    fallbackReply = "For Data Structures & Algorithms, focus on: Array Sliding Window, Binary Search, Trees (BST traversal), Graphs (BFS/DFS), and Dynamic Programming. Would you like to try a practice question?";
    action = { label: 'Practice 1,000+ Questions ➔', actionType: 'register' };
  } else if (q.includes('quiz') || q.includes('test') || q.includes('practice question') || q.includes('quiz me')) {
    fallbackReply = "Here is an interactive interview question for you:";
    quiz = {
      category: "Data Structures & Algorithms",
      question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
      correctIndex: 1,
      explanation: "A balanced BST halves the search space at each level, achieving O(log N) average search time."
    };
    action = { label: 'Unlock 1,000+ Questions ➔', actionType: 'register' };
  }

  res.status(200).json({ reply: fallbackReply, quiz, action });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 CampusEdge Server running on port ${PORT}`));