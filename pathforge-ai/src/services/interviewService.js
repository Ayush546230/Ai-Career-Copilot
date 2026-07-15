import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Start a mock interview session
 */
export const startInterview = async (interviewType = 'technical', targetRole = '') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/interview/start`, 
            { interviewType, targetRole },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Send a message in the interview chat
 */
export const sendInterviewMessage = async (sessionId, userMessage) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/interview/chat`, 
            { sessionId, userMessage },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * End interview and get scorecard
 */
export const endInterview = async (sessionId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/interview/end/${sessionId}`, 
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
