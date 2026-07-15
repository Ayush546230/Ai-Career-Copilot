const { Student } = require('../models');
const aiEngineService = require('../services/aiEngine.service');
const logger = require('../utils/logger');

/**
 * @desc    Start a mock interview session
 * @route   POST /api/interview/start
 * @access  Private (Student only)
 */
const startInterview = async (req, res) => {
    try {
        const studentId = req.userId || req.user?._id;
        const { interviewType, targetRole } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get primary resume text
        const primaryResume = student.resumes.find(r => r.isPrimary) || student.resumes[0];
        if (!primaryResume) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please upload a resume first before starting an interview' 
            });
        }

        const resumeText = primaryResume.extractedText;
        const roleStr = targetRole || student.profile?.targetRole || 'Software Engineer';

        // Call AI Engine
        const result = await aiEngineService.client.post('/api/v1/interview/start', {
            resume_text: resumeText,
            target_role: roleStr,
            interview_type: interviewType || 'technical'
        });

        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        logger.error('Start interview error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to start interview session',
            error: error.message
        });
    }
};

/**
 * @desc    Process interview chat message
 * @route   POST /api/interview/chat
 * @access  Private (Student only)
 */
const processChat = async (req, res) => {
    try {
        const { sessionId, userMessage } = req.body;

        if (!sessionId || !userMessage) {
            return res.status(400).json({ success: false, message: 'Session ID and message are required' });
        }

        const result = await aiEngineService.client.post('/api/v1/interview/chat', {
            session_id: sessionId,
            user_message: userMessage
        });

        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        logger.error('Interview chat error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to process interview message',
            error: error.message
        });
    }
};

/**
 * @desc    End interview and get report
 * @route   POST /api/interview/end/:sessionId
 * @access  Private (Student only)
 */
const endInterview = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await aiEngineService.client.post(`/api/v1/interview/end/${sessionId}`);

        // Optionally, save the result to Student's interview history in MongoDB
        // const studentId = req.userId;
        // await Student.findByIdAndUpdate(studentId, { $push: { interviewHistory: result.data } });

        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        logger.error('End interview error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to generate interview report',
            error: error.message
        });
    }
};

module.exports = {
    startInterview,
    processChat,
    endInterview
};
