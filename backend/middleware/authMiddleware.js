const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campusedge_secure_jwt_token_auth_secret_2026_production_v1';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET environment variable is not defined in environment variables. Using safe default secret. Please configure JWT_SECRET in production.');
}

/**
 * Middleware to authenticate requests using JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired authentication token. Please log in again.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Optional authentication middleware - attaches user if token exists, but doesn't block if missing
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

/**
 * Middleware to restrict endpoints to Admin accounts only
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin privileges required for this action.' });
  }
  next();
}

/**
 * Simple in-memory rate limiter to protect against brute force and API credit exhaustion
 */
const requestCounts = new Map();

function rateLimiter({ windowMs = 60 * 1000, max = 30, message = 'Too many requests. Please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    let clientData = requestCounts.get(ip);
    if (!clientData || now - clientData.startTime > windowMs) {
      clientData = { startTime: now, count: 1 };
      requestCounts.set(ip, clientData);
    } else {
      clientData.count++;
    }

    if (clientData.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  rateLimiter
};
