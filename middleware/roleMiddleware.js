// authorize is a function that RETURNS middleware
// This lets us pass in which roles are allowed
// Usage: authorize('admin') or authorize('admin', 'moderator')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is already set by protect middleware
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — your role (${req.user.role}) is not authorized for this action`,
      });
    }
    next(); // role is allowed — proceed to controller
  };
};

module.exports = { authorize };
