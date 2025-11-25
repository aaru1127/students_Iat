// Role-based Authorization Middleware
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};

module.exports = roleMiddleware;
