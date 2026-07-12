const express = require('express');
const router = express.Router();
const {
  getMentors,
  sendMentorshipRequest,
  updateProfile,
  getDashboard,
  matchMentorsWithAI,
  acceptRequest,
  rejectRequest,
  removeStudent
} = require('../controllers/mentor.controller');
const { protect, isStudent, isMentor } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', getMentors);

// Student-only routes
router.post('/request', protect, isStudent, sendMentorshipRequest);
router.post('/match', protect, isStudent, matchMentorsWithAI);

// Mentor-only routes
router.get('/dashboard', protect, isMentor, getDashboard);
router.patch('/profile', protect, isMentor, updateProfile);
router.post('/accept-request/:requestId', protect, isMentor, acceptRequest);
router.post('/reject-request/:requestId', protect, isMentor, rejectRequest);
router.post('/remove-student/:studentId', protect, isMentor, removeStudent);

module.exports = router;