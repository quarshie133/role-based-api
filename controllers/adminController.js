const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// ══════════════════════════════════════════════════════════
// GET ALL USERS — GET /api/admin/users
// ══════════════════════════════════════════════════════════
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// BLOCK USER — PATCH /api/admin/users/:id/block
// Teaches: Soft-disabling an account + logging the action
// ══════════════════════════════════════════════════════════
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Admin cannot block themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot block yourself" });
    }

    // Admin cannot block another admin
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot block another admin" });
    }

    if (user.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
    }

    // Block the user
    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedReason = req.body.reason || "Blocked by admin";
    await user.save();

    // Log the action
    await AuditLog.create({
      performedBy: req.user._id,
      action: "USER_BLOCKED",
      targetUser: user._id,
      details: `Admin blocked user ${user.email}. Reason: ${user.blockedReason}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been blocked`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// UNBLOCK USER — PATCH /api/admin/users/:id/unblock
// ══════════════════════════════════════════════════════════
const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "User is not blocked" });
    }

    // Unblock the user
    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedReason = null;
    await user.save();

    // Log the action
    await AuditLog.create({
      performedBy: req.user._id,
      action: "USER_UNBLOCKED",
      targetUser: user._id,
      details: `Admin unblocked user ${user.email}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been unblocked`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PROMOTE USER TO ADMIN — PATCH /api/admin/users/:id/promote
// Teaches: Changing a user's role
// ══════════════════════════════════════════════════════════
const promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    // Log the action
    await AuditLog.create({
      performedBy: req.user._id,
      action: "USER_PROMOTED",
      targetUser: user._id,
      details: `Admin promoted ${user.email} to admin role`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${user.username} has been promoted to admin`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DEMOTE ADMIN TO USER — PATCH /api/admin/users/:id/demote
// ══════════════════════════════════════════════════════════
const demoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Cannot demote yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot demote yourself" });
    }

    if (user.role === "user") {
      return res
        .status(400)
        .json({ success: false, message: "User is already a regular user" });
    }

    user.role = "user";
    await user.save();

    // Log the action
    await AuditLog.create({
      performedBy: req.user._id,
      action: "USER_DEMOTED",
      targetUser: user._id,
      details: `Admin demoted ${user.email} from admin to user`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${user.username} has been demoted to regular user`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// DELETE USER — DELETE /api/admin/users/:id
// ══════════════════════════════════════════════════════════
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot delete yourself" });
    }

    await AuditLog.create({
      performedBy: req.user._id,
      action: "USER_DELETED",
      targetUser: user._id,
      details: `Admin permanently deleted user ${user.email}`,
      ipAddress: req.ip,
    });

    await User.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET AUDIT LOGS — GET /api/admin/audit-logs
// Teaches: Reading the history of all admin actions
// ══════════════════════════════════════════════════════════
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "username email role") // who did it
      .populate("targetUser", "username email role") // who was affected
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers, 
  blockUser, 
  unblockUser, 
  promoteUser, 
  demoteUser, 
  deleteUser, 
  getAuditLogs 
};
