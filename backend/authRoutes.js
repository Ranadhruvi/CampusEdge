const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { JWT_SECRET, rateLimiter, authenticateToken } = require('./middleware/authMiddleware');
const router = express.Router();

// Helper to validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET CURRENT AUTHENTICATED USER (Sync fresh role from database)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, name, email, role, dob, hometown, address FROM users WHERE LOWER(email) = LOWER($1)',
      [req.user.email]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found in system.' });
    }
    const freshUser = userRes.rows[0];
    res.json({
      user: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role,
        dob: freshUser.dob,
        hometown: freshUser.hometown,
        address: freshUser.address
      }
    });
  } catch (err) {
    console.error('Error fetching /api/auth/me:', err.message);
    res.status(500).json({ message: 'Server error retrieving user profile.' });
  }
});

// REGISTER API
router.post('/register', rateLimiter({ max: 20, message: 'Too many registration attempts. Please wait.' }), async (req, res) => {
  const { name, email, password, role, adminSecretKey, address, dob, hometown, phone } = req.body;
  try {
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (!address || address.trim() === '') {
      return res.status(400).json({ message: 'Address (Current City / Location) is mandatory for registration.' });
    }

    const userExist = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'This email is already registered. Please log in.' });
    }

    let assignedRole = 'student';

    if (role === 'admin') {
      const correctAdminCode = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';
      if (!adminSecretKey || adminSecretKey !== correctAdminCode) {
        return res.status(403).json({ message: 'Invalid Admin Secret Passphrase. Please check your admin key.' });
      }
      assignedRole = 'admin';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const cleanPhone = phone ? phone.toString().trim() : null;

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, address, dob, hometown, phone) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, email, role, address, dob, hometown, phone`,
      [name.trim(), cleanEmail, hashedPassword, assignedRole, address.trim(), dob || null, hometown || null, cleanPhone]
    );

    const user = newUser.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'Registration successful!', 
      token, 
      user 
    });
  } catch (err) {
    console.error("Auth register error:", err.message);
    res.status(500).json({ message: 'Server Error during registration.' });
  }
});

// LOGIN API
router.post('/login', rateLimiter({ max: 20, message: 'Too many login attempts. Please wait.' }), async (req, res) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    if (user.password === 'GOOGLE_AUTH_USER') {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please click "Continue with Google".' });
    }

    if (!user.password || !(user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
      return res.status(400).json({ message: 'Account requires password reset. Please contact administration.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Strict role validation based on selected portal option:
    // - Admin only enter dashboard if they select admin radio button
    // - Student only enter through student radio button
    if (role) {
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({ 
          message: "Access denied: This is a Student account. Please select the 'Student' role option to sign in." 
        });
      }
      if (role === 'student' && user.role === 'admin') {
        return res.status(403).json({ 
          message: "Access denied: This is an Administrator account. Please select the 'Admin' role option to sign in." 
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dob: user.dob,
        hometown: user.hometown,
        address: user.address
      }
    });
  } catch (err) {
    console.error("Auth login error:", err.message);
    res.status(500).json({ message: 'Server Error during login.' });
  }
});

// UNLOCK ADMIN ACCESS WITH PASSPHRASE
router.post('/unlock-admin', async (req, res) => {
  const { email, adminSecretKey } = req.body;
  try {
    if (!email || !adminSecretKey) {
      return res.status(400).json({ message: 'Email and Admin Secret Passphrase are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const correctAdminCode = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';

    if (adminSecretKey.trim() !== correctAdminCode.trim()) {
      return res.status(403).json({ message: 'Invalid Admin Secret Passphrase. Please check your admin key.' });
    }

    const result = await pool.query(
      `UPDATE users SET role = 'admin' WHERE LOWER(email) = $1 RETURNING id, name, email, role, address, dob, hometown`,
      [cleanEmail]
    );

    let updatedUser;
    if (result.rows.length === 0) {
      // Auto-provision admin user if account doesn't exist yet
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = req.body.password ? req.body.password : 'Admin@2026';
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      const insertResult = await pool.query(
        `INSERT INTO users (name, email, password, role, address) 
         VALUES ($1, $2, $3, 'admin', 'Campus Administration') 
         RETURNING id, name, email, role, address, dob, hometown`,
        [req.body.name || 'Campus Administrator', cleanEmail, hashedPassword]
      );
      updatedUser = insertResult.rows[0];
    } else {
      updatedUser = result.rows[0];
    }

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: 'admin', name: updatedUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '👑 Administrator privileges successfully verified!',
      token,
      user: updatedUser
    });
  } catch (err) {
    console.error('Error unlocking admin access:', err.message);
    res.status(500).json({ message: 'Failed to unlock admin access.' });
  }
});

// ==========================================
// FORGOT & RESET PASSWORD SYSTEM (EMAIL OR MOBILE)
// ==========================================

const nodemailer = require('nodemailer');
const passport = require('passport');

// Ensure users table has phone, reset_otp columns
async function initResetColumns() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(25);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP;
    `);
  } catch (err) {
    console.error("Warning initializing reset columns in users table:", err.message);
  }
}
initResetColumns();

// In-memory fallback cache for OTPs (ensures zero downtime even if DB is migrating)
const otpCache = new Map();

// Configure optional nodemailer mailer
let mailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// 1. FORGOT PASSWORD API (Using Email OR Mobile Number)
router.post('/forgot-password', rateLimiter({ max: 15, message: 'Too many reset attempts. Please wait a few moments.' }), async (req, res) => {
  const { email, phone, identifier } = req.body;
  try {
    const rawInput = (identifier || email || phone || '').toString().trim();
    if (!rawInput) {
      return res.status(400).json({ message: 'Please provide your registered Email Address or Mobile Number.' });
    }

    const cleanDigits = rawInput.replace(/\D/g, '');
    const isEmail = rawInput.includes('@');

    let userRes;
    if (isEmail) {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, password FROM users WHERE LOWER(email) = LOWER($1)`,
        [rawInput.toLowerCase()]
      );
    } else if (cleanDigits.length >= 7) {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, password FROM users 
         WHERE phone = $1 
            OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE '%' || $2 || '%'`,
        [rawInput, cleanDigits.slice(-10)]
      );
    } else {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, password FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1`,
        [rawInput.toLowerCase()]
      );
    }

    if (userRes.rows.length === 0) {
      return res.status(404).json({ 
        message: 'No registered account found with this email or mobile number. Please check your spelling or register.' 
      });
    }

    const user = userRes.rows[0];

    if (user.password === 'GOOGLE_AUTH_USER') {
      return res.status(400).json({ 
        message: 'This account was created with Google Sign-In. Please click "Continue with Google" to access your account.' 
      });
    }

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 minutes

    // Store in database
    await pool.query(
      `UPDATE users SET reset_otp = $1, reset_otp_expires = $2 WHERE id = $3`,
      [otp, expiresAt, user.id]
    );

    // Also store in fallback memory cache by email and by identifier
    otpCache.set(user.email.toLowerCase(), { otp, expiresAt, id: user.id });
    if (user.phone) {
      otpCache.set(user.phone, { otp, expiresAt, id: user.id });
    }
    otpCache.set(rawInput.toLowerCase(), { otp, expiresAt, id: user.id });

    console.log(`🔐 [Password Reset OTP] For user ${user.name} (${user.email} / ${user.phone || 'no phone'}): ${otp} (Valid until ${expiresAt.toLocaleTimeString()})`);

    // Dispatch email if mailer is configured
    let emailSent = false;
    if (mailTransporter && user.email) {
      try {
        await mailTransporter.sendMail({
          from: `"CampusEdge Security" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'CampusEdge Password Reset Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #4f46e5; margin-bottom: 8px;">CampusEdge Password Reset</h2>
              <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
                Hello <strong>${user.name}</strong>, we received a request to reset your password. Use the verification code below to proceed:
              </p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                This verification code will expire in 15 minutes. If you did not request this, please disregard this email.
              </p>
            </div>
          `
        });
        emailSent = true;
      } catch (mailErr) {
        console.warn("Mail dispatch failed (falling back to direct response OTP):", mailErr.message);
      }
    }

    res.status(200).json({
      message: emailSent 
        ? 'A 6-digit verification code has been sent to your registered email address.' 
        : `Verification code generated! Enter the 6-digit code below to set your new password.`,
      identifier: rawInput,
      email: user.email,
      phone: user.phone || null,
      devOtp: otp // Transparently provided for local and demo testing
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: 'Server error processing password reset request.' });
  }
});

// 2. RESET PASSWORD API (Verify OTP & Apply New Password with Email OR Mobile Number)
router.post('/reset-password', rateLimiter({ max: 20, message: 'Too many attempts. Please wait.' }), async (req, res) => {
  const { identifier, email, phone, otp, newPassword } = req.body;
  try {
    const rawInput = (identifier || email || phone || '').toString().trim();
    if (!rawInput || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email / Mobile number, verification code, and new password are all required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const cleanOtp = otp.toString().trim();
    const cleanDigits = rawInput.replace(/\D/g, '');
    const isEmail = rawInput.includes('@');

    // Look up user by email or phone
    let userRes;
    if (isEmail) {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, reset_otp, reset_otp_expires FROM users WHERE LOWER(email) = LOWER($1)`,
        [rawInput.toLowerCase()]
      );
    } else if (cleanDigits.length >= 7) {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, reset_otp, reset_otp_expires FROM users 
         WHERE phone = $1 
            OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE '%' || $2 || '%'`,
        [rawInput, cleanDigits.slice(-10)]
      );
    } else {
      userRes = await pool.query(
        `SELECT id, name, email, phone, role, reset_otp, reset_otp_expires FROM users WHERE LOWER(email) = LOWER($1) OR phone = $1`,
        [rawInput.toLowerCase()]
      );
    }

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found with provided email or mobile number.' });
    }

    const user = userRes.rows[0];
    const now = new Date();

    // Verify OTP against DB or memory cache
    const dbValid = user.reset_otp && user.reset_otp === cleanOtp && new Date(user.reset_otp_expires) > now;
    const cached = otpCache.get(user.email.toLowerCase()) || otpCache.get(rawInput.toLowerCase());
    const cacheValid = cached && cached.otp === cleanOtp && cached.expiresAt > now;

    if (!dbValid && !cacheValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new code.' });
    }

    // Hash the new password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset tokens
    const updateRes = await pool.query(
      `UPDATE users 
       SET password = $1, reset_otp = NULL, reset_otp_expires = NULL 
       WHERE id = $2 
       RETURNING id, name, email, phone, role, dob, hometown, address`,
      [hashedPassword, user.id]
    );

    // Clear memory cache
    otpCache.delete(user.email.toLowerCase());
    otpCache.delete(rawInput.toLowerCase());

    const updatedUser = updateRes.rows[0];

    // Issue fresh JWT token for seamless auto-login
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Password reset successful! Logging you in...',
      token,
      user: updatedUser
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
});

// ==========================================
// GOOGLE OAUTH ROUTES (MOUNTED IN AUTH ROUTER)
// ==========================================
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'student';
  const clientUrl = req.query.clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    if (passport && passport._strategies && passport._strategies.google) {
      return passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: JSON.stringify({ role, clientUrl })
      })(req, res, next);
    }
  } catch (err) {
    console.error('Passport Google initiation error:', err);
  }
  res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Google Sign-In is temporarily unavailable.")}`);
});

router.get('/google/callback', (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    if (passport && passport._strategies && passport._strategies.google) {
      return passport.authenticate('google', { session: false }, (err, user, info) => {
        let requestedRole = 'student';
        let returnClientUrl = clientUrl;
        try {
          if (req.query.state) {
            const parsedState = JSON.parse(req.query.state);
            if (parsedState.role) requestedRole = parsedState.role;
            if (parsedState.clientUrl) returnClientUrl = parsedState.clientUrl;
          }
        } catch (e) {}

        if (err || !user) {
          const errMsg = encodeURIComponent(err?.message || 'Google authentication failed.');
          return res.redirect(`${returnClientUrl}/login?error=${errMsg}`);
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
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

        const destination = user.role === 'admin' ? '/admin' : '/dashboard';
        return res.redirect(`${returnClientUrl}${destination}?googleUser=${userData}`);
      })(req, res, next);
    }
  } catch (err) {
    console.error('Passport Google callback error in auth router:', err);
  }
  res.redirect(`${clientUrl}/login?error=${encodeURIComponent("Google authentication failed.")}`);
});

module.exports = router;