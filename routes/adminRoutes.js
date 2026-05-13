const express       = require('express');
const router        = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAllUsers,
  blockUser,
  unblockUser,
  promoteUser,
  demoteUser,
  deleteUser,
  getAuditLogs,
} = require('../controllers/adminController');

// Every route here requires: 1) logged in 2) must be admin
router.use(protect);
router.use(authorize('admin'));

router.get('/users',               getAllUsers);
router.patch('/users/:id/block',   blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.patch('/users/:id/promote', promoteUser);
router.patch('/users/:id/demote',  demoteUser);
router.delete('/users/:id',        deleteUser);
router.get('/audit-logs',          getAuditLogs);

module.exports = router;