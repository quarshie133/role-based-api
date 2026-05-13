const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt      = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ══════════════════════════════════════════════════════════
// SIGNUP — POST /api/auth/signup
// ══════════════════════════════════════════════════════════
const signup = async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Determine role based on adminSecret
    let role = 'user'; // default role
    if (adminSecret) {
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid admin secret' });
      }
      role = 'admin'; // upgrade to admin if secret matches
    }

    const user = await User.create({ username, email, password, role });

    // Log the registration in audit log
    await AuditLog.create({
      performedBy: user._id,
      action:      'USER_REGISTERED',
      targetUser:  user._id,
      details:     `New ${role} account registered`,
      ipAddress:   req.ip,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,   // include role in response
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// LOGIN — POST /api/auth/login
// ══════════════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if blocked before even checking password
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: `Account blocked. Reason: ${user.blockedReason || 'Contact support'}`,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Log the login
    await AuditLog.create({
      performedBy: user._id,
      action:      'USER_LOGGED_IN',
      targetUser:  user._id,
      details:     `${user.role} logged in`,
      ipAddress:   req.ip,
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login };