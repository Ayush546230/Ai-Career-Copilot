const { Message } = require('../models');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');

/**
 * @desc    Save a new chat message
 * @route   POST /api/chat/send
 */
const sendMessage = async (req, res) => {
    try {
        const { roomId, text } = req.body;
        const senderId = req.userId;
        const senderType = req.userRole === 'mentor' ? 'Mentor' : 'Student';
        const receiverType = senderType === 'Mentor' ? 'Student' : 'Mentor';

        // Derive receiver from roomId (roomId = sorted join of both IDs)
        const ids = roomId.split('-');
        const receiverId = ids.find(id => id !== senderId);

        if (!receiverId) {
            return res.status(400).json({ success: false, message: 'Invalid roomId' });
        }

        const message = await Message.create({
            sender: senderId,
            senderType,
            receiver: receiverId,
            receiverType,
            text,
            roomId
        });

        res.status(201).json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get chat history for a room
 * @route   GET /api/chat/history/:roomId
 */
const getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await Message.find({ roomId })
            .sort({ createdAt: 1 })
            .limit(100);

        const formattedMessages = messages.map(m => ({
            senderId: m.sender.toString(),
            text: m.text,
            timestamp: m.createdAt,
            isRead: m.isRead
        }));

        res.status(200).json({ success: true, messages: formattedMessages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/chat/my-chats
 */
const getMyChats = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole; // 'student' or 'mentor'

        // Find all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).sort({ createdAt: -1 });

        // Group by roomId — keep only the latest message per room
        const roomMap = {};
        for (const msg of messages) {
            if (!roomMap[msg.roomId]) {
                roomMap[msg.roomId] = msg;
            }
        }

        // For each unique room, fetch the other party's name
        const conversations = await Promise.all(
            Object.values(roomMap).map(async (msg) => {
                const isUserSender = msg.sender.toString() === userId;
                const otherPartyId = isUserSender ? msg.receiver : msg.sender;
                const otherPartyType = isUserSender ? msg.receiverType : msg.senderType;

                let otherName = 'Unknown';
                try {
                    if (otherPartyType === 'Student') {
                        const s = await Student.findById(otherPartyId).select('profile.firstName profile.lastName').lean();
                        if (s) otherName = `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.trim();
                    } else {
                        const m = await Mentor.findById(otherPartyId).select('profile.firstName profile.lastName').lean();
                        if (m) otherName = `${m.profile?.firstName || ''} ${m.profile?.lastName || ''}`.trim();
                    }
                } catch (_) { /* fallback to Unknown */ }

                return {
                    roomId: msg.roomId,
                    recipientId: otherPartyId.toString(),
                    recipientName: otherName || 'Unknown',
                    recipientRole: otherPartyType,
                    lastMessage: msg.text,
                    lastMessageAt: msg.createdAt,
                    isRead: msg.isRead
                };
            })
        );

        // Sort by most recent
        conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        res.status(200).json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    sendMessage,
    getChatHistory,
    getMyChats
};
