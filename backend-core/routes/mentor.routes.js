const express = require('express');
const router = express.Router();
const {
  getMentors,
  sendMentorshipRequest,
  updateProfile,
  getDashboard
} = require('../controllers/mentor.controller');
const { protect, isStudent, isMentor } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', getMentors);

// Student-only routes
router.post('/request', protect, isStudent, sendMentorshipRequest);

// Mentor-only routes
router.get('/dashboard', protect, isMentor, getDashboard);
router.patch('/profile', protect, isMentor, updateProfile);

module.exports = router;