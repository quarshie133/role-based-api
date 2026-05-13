const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getMe, updateMe } = require("../controllers/userController");

router.use(protect); // all user routes require login

router.get("/me", getMe);
router.put("/me", updateMe);

module.exports = router;
