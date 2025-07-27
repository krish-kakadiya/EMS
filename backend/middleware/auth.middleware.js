import jwt from 'jsonwebtoken';

// Middleware to protect routes
const protectedRoutes = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({  // ✅ Fixed the misplaced `.json()`
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach decoded payload (e.g. id, role) to request
    next();

  } catch (error) {
    console.log("Not Authorized");
    return res.status(401).json({
      success: false,
      message: "Not Authorized",
    });
  }
};

// Middleware to allow only admin users
const adminRoutes = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied, admin only",
    });
  }

  next();
};

export { protectedRoutes, adminRoutes };
