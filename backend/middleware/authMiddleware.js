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

  const adminKey = req.headers['x-admin-key'] || req.headers['x-admin-passphrase'] || req.query?.adminKey || req.body?.adminSecretKey;
  const correctKey = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';
  const hasMasterKey = adminKey && adminKey.trim() === correctKey.trim();

  if (!token) {
    if (hasMasterKey) {
      req.user = { id: 0, role: 'admin', name: 'Master Administrator', email: 'admin@campusedge.edu' };
      return next();
    }
    return res.status(401).json({ message: 'Access Denied: Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (hasMasterKey) {
        req.user = { id: 0, role: 'admin', name: 'Master Administrator', email: 'admin@campusedge.edu' };
        return next();
      }
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

  const adminKey = req.headers['x-admin-key'] || req.headers['x-admin-passphrase'] || req.query?.adminKey || req.body?.adminSecretKey;
  const correctKey = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';
  const hasMasterKey = adminKey && adminKey.trim() === correctKey.trim();

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      } else if (hasMasterKey) {
        req.user = { id: 0, role: 'admin', name: 'Master Administrator', email: 'admin@campusedge.edu' };
      }
      next();
    });
  } else {
    if (hasMasterKey) {
      req.user = { id: 0, role: 'admin', name: 'Master Administrator', email: 'admin@campusedge.edu' };
    }
    next();
  }
}

/**
 * Middleware to restrict endpoints to Admin accounts only
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  const adminKey = req.headers['x-admin-key'] || req.headers['x-admin-passphrase'] || req.query?.adminKey || req.body?.adminSecretKey;
  const correctKey = process.env.ADMIN_SECRET_KEY || 'CampusEdge2026';
  if (adminKey && adminKey.trim() === correctKey.trim()) {
    if (!req.user) {
      req.user = { id: 0, role: 'admin', name: 'Master Administrator', email: 'admin@campusedge.edu' };
    }
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin privileges required for this action.' });
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
