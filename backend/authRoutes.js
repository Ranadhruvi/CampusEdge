const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { JWT_SECRET, rateLimiter } = require('./middleware/authMiddleware');
const router = express.Router();

// Helper to validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// REGISTER API
router.post('/register', rateLimiter({ max: 20, message: 'Too many registration attempts. Please wait.' }), async (req, res) => {
  const { name, email, password, role, adminSecretKey, address, dob, hometown } = req.body;
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

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, address, dob, hometown) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, role, address, dob, hometown`,
      [name.trim(), cleanEmail, hashedPassword, assignedRole, address.trim(), dob || null, hometown || null]
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
  const { email, password } = req.body;
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

module.exports = router;