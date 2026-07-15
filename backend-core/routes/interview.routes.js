const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middlewares/auth.middleware');

// All interview routes are protected
router.use(protect);

router.post('/start', interviewController.startInterview);
router.post('/chat', interviewController.processChat);
router.post('/end/:sessionId', interviewController.endInterview);

module.exports = router;
