const User = require("../models/User");

// GET MY PROFILE — GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE MY PROFILE — PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    // Prevent users from changing their own role
    if (req.body.role) {
      return res
        .status(403)
        .json({ success: false, message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMe, updateMe };
