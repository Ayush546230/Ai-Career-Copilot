
// File: backend-core/services/aiEngine.service.js

const axios = require('axios');
const { redisClient } = require('../config/redis');
const crypto = require('crypto');

class AIEngineService {
    constructor() {
        this.baseURL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        this.apiPrefix = '/api/v1';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 120000, // 120 seconds
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check if AI Engine is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('AI Engine health check failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze a resume with retry logic for rate limits
     * @param {string} resumeText - Raw resume text
     * @param {string} targetRole - Target job role
     * @param {number} retries - Number of retry attempts
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeResume(resumeText, targetRole, retries = 3) {
        const textHash = crypto.createHash('md5').update(resumeText + targetRole).digest('hex');
        const cacheKey = `analysis:${textHash}`;

        // 1. Check Redis
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(' Serving from Redis Cache');
            return { success: true, data: JSON.parse(cached), fromCache: true };
        }

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`DEBUG: Sending request to AI Engine: ${this.baseURL}${this.apiPrefix}/analyze-resume (Attempt ${attempt + 1}/${retries})`);
                console.log(`DEBUG: Payload:`, { target_role: targetRole, text_length: resumeText.length });

                const response = await this.client.post(`${this.apiPrefix}/analyze-resume`, {
                    resume_text: resumeText,
                    target_role: targetRole
                });

                await redisClient.setEx(cacheKey, 86400, JSON.stringify(response.data));
                return { success: true, data: response.data, fromCache: false };

            } catch (error) {
                const status = error.response?.status;
                const data = error.response?.data;

                if (status === 429) {
                    // Rate limit error - retry with exponential backoff
                    if (attempt < retries - 1) {
                        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                        console.warn(`Rate limit (429) hit. Retrying in ${backoffMs}ms...`);
                        await new Promise(resolve => setTimeout(resolve, backoffMs));
                        continue; // Retry
                    } else {
                        console.error('Resume analysis failed after max retries due to rate limit');
                        throw new Error('Rate limit exceeded. The AI service is currently overloaded. Please try again in a few moments.');
                    }
                } else if (status === 503) {
                    console.error('Resume analysis failed!');
                    console.error('AI service is temporarily unavailable');
                    throw new Error('AI service is temporarily unavailable');
                } else if (status === 422) {
                    console.error('Resume analysis failed!');
                    console.error('Error Response Data:', JSON.stringify(data, null, 2));
                    throw new Error(`Invalid input: ${data.message || 'Validation error'}`);
                } else {
                    // Log all errors
                    console.error('Resume analysis failed!');
                    if (error.response) {
                        console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
                        console.error('Error Response Status:', error.response.status);
                    } else if (error.request) {
                        console.error('No response received from AI Engine. Is it running?');
                        console.error('Error Request:', error.request);
                    } else {
                        console.error('Error Message:', error.message);
                    }
                    throw new Error('Failed to analyze resume');
                }
            }
        }
    }

    /**
     * Get available AI providers
     */
    async getProviders() {
        try {
            const response = await this.client.get(`${this.apiPrefix}/providers`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to fetch providers:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Match mentors based on student profile with retry logic for rate limits
     * @param {Object} studentData - Student resume and preferences
     * @param {number} retries - Number of retry attempts
     */
    async matchMentors(studentData, retries = 3) {
        const url = `${this.apiPrefix}/mentors/match`;
        
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`DEBUG: Matching Mentors at ${this.baseURL}${url} (Attempt ${attempt + 1}/${retries})`);
                console.log(`DEBUG: Payload keys:`, Object.keys(studentData));
                
                const response = await this.client.post(url, studentData);
                return { success: true, data: response.data };
            } catch (error) {
                const status = error.response?.status;
                
                if (status === 429) {
                    // Rate limit error - retry with exponential backoff
                    if (attempt < retries - 1) {
                        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                        console.warn(`Rate limit (429) hit. Retrying in ${backoffMs}ms...`);
                        await new Promise(resolve => setTimeout(resolve, backoffMs));
                        continue; // Retry
                    } else {
                        console.error('Mentor matching failed after max retries due to rate limit');
                        return { 
                            success: false, 
                            error: 'Rate limit exceeded. The AI service is currently overloaded. Please try again in a few moments.'
                        };
                    }
                } else if (status === 503) {
                    // Service unavailable - don't retry
                    console.error('AI service is temporarily unavailable');
                    return { 
                        success: false, 
                        error: 'AI service is temporarily unavailable. Please try again later.'
                    };
                } else {
                    // Other errors - don't retry
                    console.error('Mentor matching failed ERROR:', error.message);
                    if (error.response) {
                        console.error('AI Engine Error Response:', error.response.data);
                    }
                    return { success: false, error: error.message };
                }
            }
        }
    }
}

module.exports = new AIEngineService();
