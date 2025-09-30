import jwt from 'jsonwebtoken';

// Authenticate user via JWT stored in httpOnly cookie
const protectedRoutes = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role }
      return next();
    } catch (err) {
      const isExpired = err?.name === 'TokenExpiredError';
      return res.status(401).json({ success: false, message: isExpired ? 'Session expired, please login again' : 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Auth middleware error' });
  }
};

// Authorize multiple roles
const authorizeRoles = (...allowed) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  return next();
};

// Legacy alias (kept for backward compatibility) – only HR
const adminRoutes = (req, res, next) => authorizeRoles('hr')(req, res, next);

export { protectedRoutes, authorizeRoles, adminRoutes };

