const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/my-chats', chatController.getMyChats);
router.post('/send', chatController.sendMessage);
router.get('/history/:roomId', chatController.getChatHistory);

module.exports = router;
