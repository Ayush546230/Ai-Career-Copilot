
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
            timeout: 60000, // 60 seconds
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
     * Analyze a resume
     * @param {string} resumeText - Raw resume text
     * @param {string} targetRole - Target job role
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeResume(resumeText, targetRole) {
        try {


            const textHash = crypto.createHash('md5').update(resumeText + targetRole).digest('hex');
            const cacheKey = `analysis:${textHash}`;

            // 1. Check Redis
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                console.log(' Serving from Redis Cache');
                return { success: true, data: JSON.parse(cached), fromCache: true };
            }
            const response = await this.client.post(`${this.apiPrefix}/analyze-resume`, {
                resume_text: resumeText,
                target_role: targetRole
            });

            await redisClient.setEx(cacheKey, 86400, JSON.stringify(response.data));

            return { success: true, data: response.data, fromCache: false };

        } catch (error) {
            console.error('Resume analysis failed:', error.message);

            // Handle specific error cases
            if (error.response) {
                const { status, data } = error.response;

                if (status === 503) {
                    throw new Error('AI service is temporarily unavailable');
                } else if (status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later');
                } else if (status === 422) {
                    throw new Error(`Invalid input: ${data.message || 'Validation error'}`);
                }
            }

            throw new Error('Failed to analyze resume');
        }
    }

    /**
     * Get available AI providers
     */
    async getProviders() {
        try {
            const response = await this.client.get(`${this.apiPrefix}/providers`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Failed to fetch providers:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new AIEngineService();
